from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from typing import Dict
import uuid
from app.core.security import get_current_user
from app.workers.tasks import process_media

router = APIRouter()

@router.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    # current_user: dict = Depends(get_current_user)
):
    # Example logic (pseudocode):
    upload_id = str(uuid.uuid4())
    process_media.send(upload_id)
    return {"message": "File received and processing started", "filename": file.filename, "upload_id": upload_id}

from pydantic import BaseModel
class TextPayload(BaseModel):
    text: str

@router.post("/text")
async def upload_text(
    payload: TextPayload,
    # current_user: dict = Depends(get_current_user)
):
    # Example logic (pseudocode):
    upload_id = str(uuid.uuid4())
    process_media.send(upload_id)
    return {"message": "Text received and processing started", "upload_id": upload_id}

@router.get("/reports")
async def get_reports(current_user: dict = Depends(get_current_user)):
    return {"reports": []}
