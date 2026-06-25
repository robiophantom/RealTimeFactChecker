import os
from groq import Groq
from app.core.config import settings

client = Groq(api_key=settings.GROQ_API_KEY)

def transcribe_audio(file_path: str) -> str:
    """
    Transcribes audio using Groq's Whisper API.
    """
    with open(file_path, "rb") as file:
        translation = client.audio.transcriptions.create(
            file=(os.path.basename(file_path), file.read()),
            model="whisper-large-v3",
            prompt="Specify context or leave empty",  # Optional
            response_format="json",  
            language="en", 
            temperature=0.0
        )
        return translation.text
