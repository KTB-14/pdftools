from fastapi import APIRouter, HTTPException
import json
from pathlib import Path
from ..config import OCR_ROOT


router = APIRouter()

@router.get("/status/{job_id}")
def get_status(job_id: str):
    status_path = OCR_ROOT / job_id / "status.json"

    if not status_path.exists():
        raise HTTPException(status_code=404, detail="Job non trouvé")

    with open(status_path) as f:
        return json.load(f)
