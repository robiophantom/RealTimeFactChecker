from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Dict
import uuid
from app.core.security import get_current_user
from app.workers.tasks import process_media
from app.core.db import supabase_client

router = APIRouter()

import shutil
import os

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    upload_id = str(uuid.uuid4())
    
    # Save file to shared volume
    os.makedirs("/shared_data", exist_ok=True)
    file_path = f"/shared_data/{upload_id}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    supabase_client.table("uploads").insert({
        "id": upload_id,
        "user_id": current_user["id"],
        "filename": file.filename,
        "file_type": file.content_type or "application/octet-stream",
        "storage_path": file_path
    }).execute()
    
    process_media.send(upload_id)
    return {"message": "File received and processing started", "filename": file.filename, "upload_id": upload_id}

from pydantic import BaseModel
class TextPayload(BaseModel):
    text: str

@router.post("/text")
async def upload_text(
    payload: TextPayload,
    current_user: dict = Depends(get_current_user)
):
    if len(payload.text) > 5000:
        raise HTTPException(status_code=400, detail="Text length exceeds the maximum limit of 5000 characters.")
        
    upload_id = str(uuid.uuid4())
    
    # For pasted text, create the upload record
    supabase_client.table("uploads").insert({
        "id": upload_id,
        "user_id": current_user["id"],
        "filename": "Pasted Text",
        "file_type": "text/plain",
        "storage_path": "text_input"
    }).execute()
    
    # Immediately insert the transcript to bypass file extraction in worker
    supabase_client.table("transcripts").insert({
        "upload_id": upload_id,
        "content": payload.text,
        "language": "en"
    }).execute()
    
    process_media.send(upload_id)
    return {"message": "Text received and processing started", "upload_id": upload_id}

import redis
from app.core.config import settings

redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

@router.post("/upload/{upload_id}/cancel")
async def cancel_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    # Set a cancel flag in Redis with 1 hour expiration
    redis_client.setex(f"cancel:{upload_id}", 3600, "1")
    return {"message": "Cancellation requested", "upload_id": upload_id}

@router.get("/upload/{upload_id}/status")
async def get_upload_status(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    step = redis_client.get(f"step:{upload_id}")
    
    # Also get the hard status from DB
    res = supabase_client.table("uploads").select("status, error_message").eq("id", upload_id).execute()
    status = "pending"
    error = None
    if res.data:
        status = res.data[0]["status"]
        error = res.data[0]["error_message"]
    else:
        # The row was deleted by the worker due to an abort/failure.
        status = "failed"
        error = "Process failed and was cleaned up."
        
    return {
        "upload_id": upload_id, 
        "step": step or "Initializing...",
        "status": status,
        "error_message": error
    }

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    return {"reports": []}
