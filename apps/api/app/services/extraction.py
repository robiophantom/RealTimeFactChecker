import json
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def extract_claims(text: str) -> list[dict]:
    """
    Extracts factual claims from the text using Groq LLM.
    Ignores opinions, emotions, predictions, questions.
    """
    prompt = f"""
    Analyze the following text and extract all factual claims that can be objectively verified.
    Ignore opinions, emotions, predictions, and questions.
    Output the result as a JSON array of objects, where each object has a 'claim' key and a 'context' key.
    
    Text:
    {text}
    
    Output JSON strictly:
    """
    
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a precise data extraction assistant. Always output valid JSON array."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
        max_tokens=1000,
        response_format={"type": "json_object"} # Some Groq models support JSON mode
    )
    
    response_text = completion.choices[0].message.content
    try:
        data = json.loads(response_text)
        claims_list = []
        if isinstance(data, list):
            claims_list = data
        elif "claims" in data:
            claims_list = data["claims"]
            
        # Deduplicate similar claims based on text (simple exact match or lowercased match for MVP)
        unique_claims = []
        seen = set()
        for c in claims_list:
            claim_text = c.get("claim", "").strip()
            key = claim_text.lower()
            if key and key not in seen:
                seen.add(key)
                unique_claims.append(c)
                
        return unique_claims
    except Exception as e:
        print(f"Error parsing claims: {e}")
        return []
