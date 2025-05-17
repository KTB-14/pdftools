from fastapi import APIRouter, HTTPException
from ..models.job import StatusOut, JobStatus
from celery.result import AsyncResult
from worker.tasks import celery_app
from ..config import OCR_ROOT
import json
from pathlib import Path

router = APIRouter()

@router.get("/status/{job_id}", response_model=StatusOut)
def get_status(job_id: str):
    result = AsyncResult(job_id, app=celery_app)
    state = result.state.lower()

    # Si Celery reconnaît la tâche, on l'utilise
    try:
        status = JobStatus(state)
        return StatusOut(
            job_id=job_id,
            status=status,
            details=str(result.info) if result.info else None
        )
    except ValueError:
        pass  # tâche non reconnue => fallback

    # Lecture locale de status.json si Celery ne sait pas
    status_path = OCR_ROOT / job_id / "status.json"
    if status_path.exists():
        try:
            with open(status_path, "r") as f:
                data = json.load(f)
            return StatusOut(
                job_id=job_id,
                status=JobStatus(data.get("status", "unknown")),
                details=data.get("details")
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lecture status.json : {str(e)}")

    # Si aucune info trouvée
    raise HTTPException(status_code=404, detail="Job non trouvé")
