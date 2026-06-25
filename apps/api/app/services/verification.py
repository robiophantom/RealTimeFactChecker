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

def verify_claim(claim_text: str, context: str = "") -> dict:
    """
    Verifies a single claim using Tavily Search and Groq LLM.
    Returns structured verdict.
    """
    # 1. Search for evidence
    search_query = claim_text
    evidence = search_tavily(search_query)
    
    evidence_text = "\n".join([f"- [{e['title']}]({e['url']}): {e['content']}" for e in evidence])
    
    # 2. Analyze with Groq
    prompt = f"""
    You are a professional fact-checker. Verify the following claim using the provided evidence.
    
    Claim: {claim_text}
    Context: {context}
    
    Evidence:
    {evidence_text}
    
    Analyze the evidence and produce a structured JSON output with the following keys:
    - verdict: must be one of ["True", "False", "Partially True", "Insufficient Evidence"]
    - confidence_score: a float between 0.0 and 1.0 representing your confidence in the verdict.
    - explanation: a concise explanation of why this verdict was reached based on the evidence.
    """
    
    completion = groq_client.chat.completions.create(
        model="llama3-70b-8192",
        messages=[
            {"role": "system", "content": "You are a fact-checking bot. Output ONLY valid JSON."},
            {"role": "user", "content": prompt}
        ],
        temperature=0.0,
        response_format={"type": "json_object"}
    )
    
    try:
        result = json.loads(completion.choices[0].message.content)
        result["source_references"] = [{"title": e["title"], "url": e["url"]} for e in evidence]
        return result
    except Exception as e:
        print(f"Error analyzing verification: {e}")
        return {
            "verdict": "Insufficient Evidence",
            "confidence_score": 0.0,
            "explanation": "Failed to parse LLM verification response.",
            "source_references": []
        }
