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
    Extract every FACTUAL CLAIM from the text below — a statement asserting something
    checkable against reality (true or false), such as statistics, dates, named events,
    causal statements ("X caused Y"), definitions, existence claims, comparisons, or
    predictions stated with certainty (not hedged).

    DO NOT extract:
    - Opinions, value judgments, or taste ("this is the best...", "I love...").
    - Questions, commands, or requests.
    - Hedged/uncertain statements ("I think...", "maybe...", "it could be...").
    - The speaker's own feelings, intentions, or plans ("I will try to...", "I feel...").
    - Greetings, filler, or rhetorical statements.

    If a sentence mixes opinion and fact, extract only the factual part.
    Keep claims verbatim or near-verbatim from the text — do not add information that
    isn't explicitly stated. If the same claim appears more than once, extract it only once.

    Example:
    Text: "I think the economy is doing badly because unemployment rose to 6.2% last month."
    Claims: [{{"claim": "unemployment rose to 6.2% last month", "context": "Speaker's view on the economy"}}]
    ("I think the economy is doing badly" is excluded — it's an opinion.)

    Output a JSON object with a single key "claims": an array of objects, each with:
    - "claim": the factual statement (verbatim or concisely summarized without losing meaning)
    - "context": brief surrounding context needed to understand the claim, or "" if self-contained

    Text:
    {text}

    Output JSON strictly:
    """
    
    try:
        completion = client.chat.completions.create(
            model="openai/gpt-oss-120b",
            messages=[
                {"role": "system", "content": "You are a precise, unbiased fact-extraction assistant. You extract only objectively verifiable factual claims and exclude opinions, hedged statements, questions, and intentions. Always output a valid JSON object containing the 'claims' array, with each item having exactly 'claim' and 'context' keys."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.0,
            max_tokens=2000,
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