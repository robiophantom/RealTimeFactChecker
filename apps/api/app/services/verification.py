import json
import requests
import time
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
        "max_results": 2
    }
    
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        return response.json().get("results", [])
    return []

def verify_claims_batch(claims_list: list[dict]) -> tuple[list[dict], int, int]:
    """
    Verifies a batch of claims using Tavily Search and Groq LLM in a single request.
    claims_list is a list of dicts: [{"claim_text": "...", "context": "..."}, ...]
    Returns: (results_list, total_input_tokens, total_output_tokens)
    """
    if not claims_list:
        return [], 0, 0
        
    # Process in chunks of 3 to avoid blowing past token limits
    results_out = []
    chunk_size = 3
    
    total_in_tokens = 0
    total_out_tokens = 0
    
    for chunk_start in range(0, len(claims_list), chunk_size):
        chunk_claims = claims_list[chunk_start:chunk_start+chunk_size]
        
        # 1. Search for evidence for this chunk
        all_evidence = []
        evidence_prompts = []
        
        for i, claim_obj in enumerate(chunk_claims):
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
        You are a highly professional, completely unbiased fact-checker. You are given {len(chunk_claims)} claims to verify.
        Carefully analyze and understand the provided evidence for each claim to ensure accurate results.
        
        {combined_evidence_prompt}
        
        Critically evaluate the evidence against the claim. Ensure the verdict is correct, logical, and entirely unbiased based strictly on the provided evidence.
        Produce a structured JSON output. Your output MUST be a JSON object containing a single key "results", which must be an array of exactly {len(chunk_claims)} objects in the same order as the claims provided.
        Each object in the "results" array must have the following keys:
        - verdict: must be exactly one of ["True", "False", "Partially True", "Insufficient Evidence"]
        - confidence_score: a float between 0.0 and 1.0 representing your confidence in the verdict.
        - explanation: a clear, accurate, and unbiased explanation of why this verdict was reached, directly referencing the provided evidence.
        """
        
        try:
            completion = groq_client.chat.completions.create(
                model="openai/gpt-oss-120b",
                messages=[
                    {"role": "system", "content": "You are an expert fact-checking AI. You analyze evidence objectively and provide accurate, unbiased verdicts. Always output a valid JSON object containing the 'results' array."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0,
                max_tokens=2000,
                response_format={"type": "json_object"}
            )
            
            content = completion.choices[0].message.content
            
            if completion.usage:
                total_in_tokens += completion.usage.prompt_tokens
                total_out_tokens += completion.usage.completion_tokens
            
            # Robust JSON extraction
            content = content.strip()
            if content.startswith("```json"):
                content = content[7:]
            elif content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
                
            parsed = json.loads(content.strip())
            verdicts = parsed.get("results", [])
            
            for i in range(len(chunk_claims)):
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
                
        except Exception as e:
            print(f"Error analyzing batch verification: {e}")
            for i in range(len(chunk_claims)):
                results_out.append({
                    "verdict": "Insufficient Evidence",
                    "confidence_score": 0.0,
                    "explanation": "Failed to parse LLM verification response.",
                    "source_references": []
                })
                
        # Sleep briefly to respect TPM limits across chunks
        time.sleep(2)
                
    return results_out, total_in_tokens, total_out_tokens

# Keep the single verify_claim for fallback or other uses
def verify_claim(claim_text: str, context: str = "") -> dict:
    res, _, _ = verify_claims_batch([{"claim_text": claim_text, "context": context}])
    return res[0] if res else {}
