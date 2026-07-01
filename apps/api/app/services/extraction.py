import json
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def extract_claims(text: str) -> tuple[list[dict], int, int]:
    """
    Extracts factual claims from the text using Groq LLM.
    Returns: (claims_list, input_tokens, output_tokens)
    """
    prompt = f"""
    Analyze the following text and extract ONLY factual statements that can be objectively verified.
    - Treat ANY testable statement, statistic, or data point (e.g., "Indian GDP is 25 trillion dollars") as a factual claim, even if it is a single standalone sentence.
    - Ensure that the extracted statements are accurate, exact representations of the original text, or concisely summarized without losing their original meaning.
    - Strictly ignore subjective opinions, emotions, predictions, and questions.
    
    Output the result as a JSON object containing a single key "claims", which must be an array of objects.
    Each object in the "claims" array must have a 'claim' key (the factual statement) and a 'context' key (brief explanation of surrounding context, leave empty if there is none).
    
    Text:
    {text}
    
    Output JSON strictly:
    """
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a precise, unbiased data extraction assistant. Focus only on extracting verifiable factual statements. Always output a valid JSON object containing the 'claims' array."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=1000,
            response_format={"type": "json_object"}
        )
        
        response_text = completion.choices[0].message.content
        input_tokens = completion.usage.prompt_tokens if completion.usage else 0
        output_tokens = completion.usage.completion_tokens if completion.usage else 0
        
        # Robust JSON extraction
        content = response_text.strip()
        if content.startswith("```json"):
            content = content[7:]
        elif content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
            
        data = json.loads(content.strip())
        claims_list = []
        if isinstance(data, list):
            claims_list = data
        elif isinstance(data, dict) and "claims" in data:
            claims_list = data["claims"]
            
        # Deduplicate similar claims based on text (simple exact match or lowercased match for MVP)
        unique_claims = []
        seen = set()
        for c in claims_list:
            if isinstance(c, dict):
                claim_text = c.get("claim", "").strip()
                key = claim_text.lower()
                if key and key not in seen:
                    seen.add(key)
                    unique_claims.append(c)
                
        return unique_claims, input_tokens, output_tokens
    except Exception as e:
        print(f"Error parsing claims: {e}")
        return [], 0, 0
