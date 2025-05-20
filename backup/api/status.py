from fastapi import APIRouter, HTTPException
from celery.result import AsyncResult
import json
from common.config import OCR_ROOT, STATUS_FILENAME
from models.job import StatusOut, JobStatus
from worker.celery_app import celery_app

router = APIRouter()

@router.get("/status/{job_id}", response_model=StatusOut)
def get_status(job_id: str):
    """
    Tente d’abord d’obtenir le statut depuis Celery (AsyncResult).
    Sinon, lit status.json dans ocr_files/{job_id}/.
    """
    result = AsyncResult(job_id, app=celery_app)
    state  = result.state.lower()

    try:
        status = JobStatus(state)
        return StatusOut(job_id=job_id,
                         status=status,
                         details=str(result.info) if result.info else None)
    except ValueError:
        pass

    status_path = OCR_ROOT / job_id / STATUS_FILENAME
    if status_path.exists():
        data = json.loads(status_path.read_text())
        return StatusOut(job_id=job_id,
                         status=JobStatus(data.get("status", "error")),
                         details=data.get("details"))
    raise HTTPException(status_code=404, detail="Job non trouvé")
