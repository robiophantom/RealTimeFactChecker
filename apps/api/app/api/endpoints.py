from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Dict
import uuid
from app.core.security import get_current_user
from app.workers.tasks import process_media
from app.core.db import supabase_client
import shutil
import os
from pydantic import BaseModel
import redis
from app.core.config import settings
from datetime import datetime

router = APIRouter()
redis_client = redis.Redis.from_url(settings.REDIS_URL, decode_responses=True)

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

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    limits = get_system_limits()
    
    # Verify file size by seeking to end
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    
    file_type = file.content_type or "application/octet-stream"
    is_media = file_type.startswith("audio/") or file_type.startswith("video/")
    
    max_size_mb = limits.get("max_media_size_mb", 50) if is_media else limits.get("max_text_size_mb", 10)
    max_size_bytes = max_size_mb * 1024 * 1024
    
    if file_size > max_size_bytes:
        raise HTTPException(status_code=400, detail=f"File size exceeds the maximum limit of {max_size_mb}MB.")

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
        "file_type": file_type,
        "file_size": file_size,
        "storage_path": file_path
    }).execute()
    
    process_media.send(upload_id)
    return {"message": "File received and processing started", "filename": file.filename, "upload_id": upload_id}

class TextPayload(BaseModel):
    text: str

@router.post("/text")
async def upload_text(
    payload: TextPayload,
    current_user: dict = Depends(get_current_user)
):
    limits = get_system_limits()
    max_text_length = limits.get("max_text_length", 100000)
    
    if len(payload.text) > max_text_length:
        raise HTTPException(status_code=400, detail=f"Text length exceeds the maximum limit of {max_text_length} characters.")
        
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

@router.post("/upload/{upload_id}/cancel")
async def cancel_upload(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    redis_client.setex(f"cancel:{upload_id}", 3600, "1")
    return {"message": "Cancellation requested", "upload_id": upload_id}

@router.get("/upload/{upload_id}/status")
async def get_upload_status(
    upload_id: str,
    current_user: dict = Depends(get_current_user)
):
    step = redis_client.get(f"step:{upload_id}")
    
    res = supabase_client.table("uploads").select("status, error_message").eq("id", upload_id).execute()
    status = "pending"
    error = None
    if res.data:
        status = res.data[0]["status"]
        error = res.data[0]["error_message"]
    else:
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

@router.get("/limits")
async def get_public_limits():
    return get_system_limits()

@router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    limits = get_system_limits()
    # Get current month start
    now = datetime.now()
    month_start = datetime(now.year, now.month, 1).isoformat()
    
    res = supabase_client.table("usage_logs").select("input_tokens, output_tokens").eq("user_id", current_user["id"]).gte("created_at", month_start).execute()
    used_tokens = sum((row.get("input_tokens", 0) + row.get("output_tokens", 0)) for row in res.data)
    
    return {
        "used_tokens": used_tokens,
        "monthly_limit": limits.get("user_monthly_token_limit", 10000)
    }

@router.get("/admin/settings")
async def admin_get_settings(current_user: dict = Depends(get_current_user)):
    user_res = supabase_client.table("users").select("role").eq("id", current_user["id"]).execute()
    if not user_res.data or user_res.data[0]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
    return get_system_limits()

class SettingsPayload(BaseModel):
    max_text_size_mb: int
    max_media_size_mb: int
    max_text_length: int
    max_transcript_tokens: int
    user_monthly_token_limit: int

@router.post("/admin/settings")
async def admin_update_settings(payload: SettingsPayload, current_user: dict = Depends(get_current_user)):
    user_res = supabase_client.table("users").select("role").eq("id", current_user["id"]).execute()
    if not user_res.data or user_res.data[0]["role"] != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")
        
    new_limits = payload.dict()
    
    # Check if limits exist to avoid unique constraint issues with upsert
    res = supabase_client.table("system_settings").select("id").eq("setting_key", "limits").execute()
    if res.data:
        supabase_client.table("system_settings").update({
            "setting_value": new_limits
        }).eq("setting_key", "limits").execute()
    else:
        supabase_client.table("system_settings").insert({
            "setting_key": "limits",
            "setting_value": new_limits
        }).execute()
    
    return {"message": "Settings updated", "limits": new_limits}
