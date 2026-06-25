import os
import dramatiq
from app.workers.broker import redis_broker
from app.services.transcription import transcribe_audio
from app.services.extraction import extract_claims
from app.services.verification import verify_claim
from app.core.db import supabase_client

@dramatiq.actor(max_retries=3)
def process_media(upload_id: str):
    """
    Main background task to process uploaded media.
    """
    print(f"Starting processing for upload_id: {upload_id}")
    
    try:
        # Update status to processing
        supabase_client.table("uploads").update({"status": "processing"}).eq("id", upload_id).execute()
        
        # 1. Get upload details
        upload_res = supabase_client.table("uploads").select("*").eq("id", upload_id).execute()
        if not upload_res.data:
            raise ValueError(f"Upload {upload_id} not found")
        upload_data = upload_res.data[0]
        storage_path = upload_data["storage_path"]
        
        # (In real implementation, download file from Supabase storage here)
        # Mocking local file path for now
        local_file_path = f"/tmp/{os.path.basename(storage_path)}" 
        
        text_content = ""
        # 2. Transcribe
        if upload_data["file_type"] in ["audio", "video"]:
            # text_content = transcribe_audio(local_file_path)
            text_content = "This is a mocked transcription for testing."
        else:
            # Document text extraction (mocked)
            text_content = "This is a mocked text from document."
            
        # Save transcript
        transcript_res = supabase_client.table("transcripts").insert({
            "upload_id": upload_id,
            "content": text_content,
            "language": "en"
        }).execute()
        transcript_id = transcript_res.data[0]["id"]
        
        # 3. Extract claims
        claims = extract_claims(text_content)
        
        total_claims = len(claims)
        true_claims = false_claims = partially_true = unverified = 0
        
        for c in claims:
            # Save claim
            claim_text = c.get("claim", "")
            context = c.get("context", "")
            c_res = supabase_client.table("claims").insert({
                "transcript_id": transcript_id,
                "claim_text": claim_text,
                "context": context
            }).execute()
            claim_id = c_res.data[0]["id"]
            
            # 4. Verify claim
            verification = verify_claim(claim_text, context)
            
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

        # Update upload status to completed
        supabase_client.table("uploads").update({"status": "completed"}).eq("id", upload_id).execute()
        print(f"Finished processing for upload_id: {upload_id}")

    except Exception as e:
        print(f"Failed processing upload {upload_id}: {e}")
        supabase_client.table("uploads").update({"status": "failed", "error_message": str(e)}).eq("id", upload_id).execute()

