import json
import requests
from groq import Groq
from app.core.config import settings

groq_client = Groq(api_key=settings.GROQ_API_KEY)

def search_tavily(query: str) -> list[dict]:
    """
    Search Tavily for evidence related to the claim.
    """
    url = "https://api.tavily.com/search"
    headers = {
        "Content-Type": "application/json"
    }
    data = {
        "api_key": settings.TAVILY_API_KEY,
        "query": query,
        "search_depth": "advanced",
        "include_answer": False,
        "max_results": 5
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json().get("results", [])
    return []

def verify_claims_batch(claims_list: list[dict]) -> list[dict]:
    """
    Verifies a batch of claims using Tavily Search and Groq LLM in a single request.
    claims_list is a list of dicts: [{"claim_text": "...", "context": "..."}, ...]
    Returns a list of structured verdicts aligned with the input list.
    """
    if not claims_list:
        return []
        
    # 1. Search for evidence for each claim
    all_evidence = []
    evidence_prompts = []
    
    for i, claim_obj in enumerate(claims_list):
        claim_text = claim_obj.get("claim_text", "")
        evidence = search_tavily(claim_text)
        all_evidence.append(evidence)
        
        ev_text = "\n".join([f"- [{e['title']}]({e['url']}): {e['content']}" for e in evidence])
        evidence_prompts.append(
            f"--- Claim {i+1} ---\nClaim: {claim_text}\nContext: {claim_obj.get('context', '')}\nEvidence:\n{ev_text}"
        )
        
    combined_evidence_prompt = "\n\n".join(evidence_prompts)
    
    # 2. Analyze with Groq
    prompt = f"""
    You are a professional fact-checker. You are given {len(claims_list)} claims to verify.
    Verify each claim using the provided evidence.
    
    {combined_evidence_prompt}
    
    Analyze the evidence and produce a structured JSON output. 
    Your output MUST be a JSON object containing a key "results" which is an array of exactly {len(claims_list)} objects in the same order as the claims provided.
    Each object must have the following keys:
    - verdict: must be one of ["True", "False", "Partially True", "Insufficient Evidence"]
    - confidence_score: a float between 0.0 and 1.0 representing your confidence in the verdict.
    - explanation: a concise explanation of why this verdict was reached based on the evidence.
    """
    
    completion = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a fact-checking bot. Output ONLY valid JSON containing the 'results' array."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    
    results_out = []
    try:
        parsed = json.loads(completion.choices[0].message.content)
        verdicts = parsed.get("results", [])
        
        for i in range(len(claims_list)):
            if i < len(verdicts):
                result = verdicts[i]
            else:
                result = {
                    "verdict": "Insufficient Evidence",
                    "confidence_score": 0.0,
                    "explanation": "Failed to parse individual verdict from batch."
                }
            result["source_references"] = [{"title": e["title"], "url": e["url"]} for e in all_evidence[i]]
            results_out.append(result)
            
        return results_out
    except Exception as e:
        print(f"Error analyzing batch verification: {e}")
        # Return fallback for all
        for i in range(len(claims_list)):
            results_out.append({
                "verdict": "Insufficient Evidence",
                "confidence_score": 0.0,
                "explanation": "Failed to parse LLM verification response.",
                "source_references": []
            })
        return results_out

# Keep the single verify_claim for fallback or other uses
def verify_claim(claim_text: str, context: str = "") -> dict:
    return verify_claims_batch([{"claim_text": claim_text, "context": context}])[0]
