import os
import dramatiq
import redis
import fitz # PyMuPDF
import docx
from datetime import datetime
from app.workers.broker import redis_broker
from app.services.transcription import transcribe_audio
from app.services.extraction import extract_claims
from app.services.verification import verify_claim, verify_claims_batch
from app.core.db import supabase_client
from app.core.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

class CancelledError(Exception):
    pass

def get_system_limits():
    res = supabase_client.table("system_settings").select("setting_value").eq("setting_key", "limits").execute()
    if res.data:
        return res.data[0]["setting_value"]
    return {
        "max_text_size_mb": 10,
        "max_media_size_mb": 50,
        "max_text_length": 100000,
        "max_transcript_tokens": 7000,
        "user_monthly_token_limit": 10000
    }

def check_token_quota(user_id: str, monthly_limit: int):
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1).isoformat()
    res = supabase_client.table("usage_logs").select("input_tokens, output_tokens").eq("user_id", user_id).gte("created_at", month_start).execute()
    used_tokens = sum((row.get("input_tokens", 0) + row.get("output_tokens", 0)) for row in res.data)
    if used_tokens >= monthly_limit:
        raise ValueError(f"You have reached your monthly limit of {monthly_limit} API tokens.")

def extract_text_from_file(file_path: str, file_type: str) -> str:
    if "text/plain" in file_type:
        with open(file_path, "r", encoding="utf-8") as f:
            return f.read()
    elif "pdf" in file_type:
        text = ""
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text()
        except Exception as e:
            raise ValueError("Failed to read PDF. It might be encrypted or corrupted.")
            
        if len(text.strip()) == 0:
            raise ValueError("No text found in PDF. Scanned images without text are not supported.")
        return text
    elif "document" in file_type or "docx" in file_type:
        doc = docx.Document(file_path)
        return "\n".join([para.text for para in doc.paragraphs])
    return ""

def check_cancel(upload_id: str):
    if redis_client.get(f"cancel:{upload_id}"):
        raise CancelledError("Processing stopped by user.")

def update_step(upload_id: str, step: str):
    redis_client.setex(f"step:{upload_id}", 3600, step)

@dramatiq.actor(max_retries=3)
def process_media(upload_id: str):
    """
    Main background task to process uploaded media.
    """
    print(f"Starting processing for upload_id: {upload_id}")
    
    try:
        check_cancel(upload_id)
        update_step(upload_id, "Initializing processing...")
        # Update status to processing
        supabase_client.table("uploads").update({"status": "processing"}).eq("id", upload_id).execute()
        
        # 1. Get upload details
        upload_res = supabase_client.table("uploads").select("*").eq("id", upload_id).execute()
        if not upload_res.data:
            raise ValueError(f"Upload {upload_id} not found")
        upload_data = upload_res.data[0]
        user_id = upload_data["user_id"]
        
        limits = get_system_limits()
        check_token_quota(user_id, limits.get("user_monthly_token_limit", 10000))
        
        # 2. Check if text is already transcribed (e.g. pasted text)
        transcript_res = supabase_client.table("transcripts").select("*").eq("upload_id", upload_id).execute()
        
        if transcript_res.data:
            # Already transcribed
            transcript_id = transcript_res.data[0]["id"]
            text_content = transcript_res.data[0]["content"]
        else:
            # Need to process the file
            file_path = upload_data["storage_path"]
            file_type = upload_data["file_type"]
            
            if not os.path.exists(file_path):
                raise FileNotFoundError(f"Uploaded file not found at {file_path}")
            
            check_cancel(upload_id)
            if file_type.startswith("audio/") or file_type.startswith("video/"):
                update_step(upload_id, "Transcribing audio to text...")
                text_content = transcribe_audio(file_path)
            else:
                update_step(upload_id, "Extracting text from document...")
                text_content = extract_text_from_file(file_path, file_type)
                
            # Cleanup local file
            try:
                os.remove(file_path)
            except:
                pass

        if len(text_content.strip()) == 0:
            raise ValueError("No valid speech or text data found in the file.")
            
        max_tokens = limits.get("max_transcript_tokens", 5000)
        # Calculate precise token count
        import tiktoken
        encoding = tiktoken.get_encoding("cl100k_base")
        num_tokens = len(encoding.encode(text_content))
        
        if num_tokens > max_tokens:
            raise ValueError(f"Extracted text exceeds the maximum allowed token limit ({max_tokens} tokens). Found {num_tokens} tokens. Please provide a shorter file.")
            
        if not transcript_res.data:
            # Save transcript
            transcript_res = supabase_client.table("transcripts").insert({
                "upload_id": upload_id,
                "content": text_content,
                "language": "en"
            }).execute()
            transcript_id = transcript_res.data[0]["id"]


        # 3. Extract claims
        check_cancel(upload_id)
        update_step(upload_id, "Analyzing text and extracting claims...")
        claims, extract_in_tokens, extract_out_tokens = extract_claims(text_content)
        
        total_claims = len(claims)
        true_claims = false_claims = partially_true = unverified = 0
        
        # Batch claims in chunks of 5
        batch_size = 5
        batches = [claims[i:i + batch_size] for i in range(0, total_claims, batch_size)]
        
        verify_in_tokens = 0
        verify_out_tokens = 0
        
        for batch_index, batch in enumerate(batches):
            check_cancel(upload_id)
            start_idx = batch_index * batch_size + 1
            end_idx = min(start_idx + batch_size - 1, total_claims)
            update_step(upload_id, f"Verifying claims {start_idx}-{end_idx} of {total_claims}...")
            
            # Format batch for verification function
            batch_for_verification = [
                {"claim_text": c.get("claim", ""), "context": c.get("context", "")}
                for c in batch
            ]
            
            # Run batched verification
            batch_results, in_tok, out_tok = verify_claims_batch(batch_for_verification)
            verify_in_tokens += in_tok
            verify_out_tokens += out_tok
            
            # Save results to DB
            for c, verification in zip(batch, batch_results):
                claim_text = c.get("claim", "")
                context = c.get("context", "")
                c_res = supabase_client.table("claims").insert({
                    "transcript_id": transcript_id,
                    "claim_text": claim_text,
                    "context": context
                }).execute()
                claim_id = c_res.data[0]["id"]
                
                supabase_client.table("claim_verifications").insert({
                    "claim_id": claim_id,
                    "verdict": verification["verdict"],
                    "confidence_score": verification["confidence_score"],
                    "explanation": verification["explanation"],
                    "source_references": verification["source_references"]
                }).execute()
                
                if verification["verdict"] == "True": true_claims += 1
                elif verification["verdict"] == "False": false_claims += 1
                elif verification["verdict"] == "Partially True": partially_true += 1
                else: unverified += 1
            
        # 5. Generate Report
        check_cancel(upload_id)
        update_step(upload_id, "Generating final verification report...")
        supabase_client.table("reports").insert({
            "upload_id": upload_id,
            "user_id": upload_data["user_id"],
            "summary": "Fact-checking process completed successfully.",
            "total_claims": total_claims,
            "true_claims": true_claims,
            "false_claims": false_claims,
            "partially_true_claims": partially_true,
            "unverified_claims": unverified
        }).execute()
        
        # Log Tokens
        total_in = extract_in_tokens + verify_in_tokens
        total_out = extract_out_tokens + verify_out_tokens
        supabase_client.table("usage_logs").insert({
            "user_id": user_id,
            "action": "verification",
            "input_tokens": total_in,
            "output_tokens": total_out
        }).execute()

        # Update upload status to completed
        update_step(upload_id, "Completed")
        supabase_client.table("uploads").update({"status": "completed"}).eq("id", upload_id).execute()
        print(f"Finished processing for upload_id: {upload_id}")

    except Exception as e:
        print(f"Failed processing upload {upload_id}: {e}")
        update_step(upload_id, f"Error: {str(e)}")
        # Do not delete the upload, keep it as failed with error message
        supabase_client.table("uploads").update({"status": "failed", "error_message": str(e)}).eq("id", upload_id).execute()

