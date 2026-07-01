import os
import json
from groq import Groq
from dotenv import load_dotenv

load_dotenv(r"d:\UsersMovedData\Desktop\RTFC\apps\api\.env")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

prompt = """
Produce a structured JSON output. Your output MUST be a JSON object containing a single key "results", which must be an array of exactly 1 objects in the same order as the claims provided.
Each object in the "results" array must have the following keys:
- verdict: must be exactly one of ["True", "False", "Partially True", "Insufficient Evidence"]
- confidence_score: a float between 0.0 and 1.0 representing your confidence in the verdict.
- explanation: a clear, accurate, and unbiased explanation of why this verdict was reached, directly referencing the provided evidence.

--- Claim 1 ---
Claim: Indian GDP is 25 trillion dollars
Context: 
Evidence:
- [India GDP] (http://example.com): India GDP is 3.5 trillion.
"""

completion = client.chat.completions.create(
    model="qwen/qwen3.6-27b",
    messages=[
        {"role": "system", "content": "You are an expert fact-checking AI. You analyze evidence objectively and provide accurate, unbiased verdicts. Always output a valid JSON object containing the 'results' array."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.0,
    max_tokens=800,
    response_format={"type": "json_object"}
)

print(completion.choices[0].message.content)
