import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(r"d:\UsersMovedData\Desktop\RTFC\apps\api\.env")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

prompt = f"""
You are a highly professional, completely unbiased fact-checker. You are given 1 claims to verify.
Carefully analyze and understand the provided evidence for each claim to ensure accurate results.

--- Claim 1 ---
Claim: Indian GDP is 25 trillion
Context: 
Evidence:
- [India GDP] (http://example.com): India's GDP is around 3.5 trillion, not 25 trillion.

Critically evaluate the evidence against the claim. Ensure the verdict is correct, logical, and entirely unbiased based strictly on the provided evidence.
Produce a structured JSON output. Your output MUST be a JSON object containing a key "results" which is an array of exactly 1 objects in the same order as the claims provided.
Each object must have the following keys:
- verdict: must be exactly one of ["True", "False", "Partially True", "Insufficient Evidence"]
- confidence_score: a float between 0.0 and 1.0 representing your confidence in the verdict.
- explanation: a clear, accurate, and unbiased explanation of why this verdict was reached, directly referencing the provided evidence.
"""

completion = client.chat.completions.create(
    model="qwen/qwen3.6-27b",
    messages=[
        {"role": "system", "content": "You are an expert fact-checking AI. You analyze evidence objectively and provide accurate, unbiased verdicts. Output ONLY valid JSON containing the 'results' array."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.0,
    max_tokens=800
)

print(completion.choices[0].message.content)
