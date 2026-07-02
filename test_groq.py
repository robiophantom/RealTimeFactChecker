import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv(r"d:\UsersMovedData\Desktop\RTFC\apps\api\.env")

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

text = "indian gdp is 25 trillion"

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

completion = client.chat.completions.create(
    model="openai/gpt-oss-120b",
    messages=[
        {"role": "system", "content": "You are a precise, unbiased data extraction assistant. Focus only on extracting verifiable factual statements. Always output a valid JSON object containing the 'claims' array."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.0,
    max_tokens=2000,
    response_format={"type": "json_object"}
)

print(completion.choices[0].message.content)
