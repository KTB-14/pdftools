from fastapi import APIRouter, HTTPException
from ..models.job import StatusOut, JobStatus
from celery.result import AsyncResult
from worker.tasks import celery_app

router = APIRouter()

@router.get("/status/{job_id}", response_model=StatusOut)
def get_status(job_id: str):
    result = AsyncResult(job_id, app=celery_app)
    state = result.state.lower()

    try:
        status = JobStatus(state)
    except ValueError:
        raise HTTPException(status_code=404, detail="Job non trouvé")

    return StatusOut(job_id=job_id, status=status, details=str(result.info) if result.info else None)
