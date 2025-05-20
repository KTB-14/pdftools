from fastapi import APIRouter, HTTPException
from app.models.job import StatusOut, JobStatus
from app.worker.tasks import celery_app
from app.config import JOBS_DIR, STATUS_FILENAME

from celery.result import AsyncResult
import json
from pathlib import Path

router = APIRouter()

@router.get("/status/{job_id}", response_model=StatusOut)
def get_status(job_id: str):
    """
    Endpoint permettant de vérifier l’état d’avancement d’un job OCR :
    - via l’état Celery si la tâche est encore en cours.
    - sinon via le fichier local status.json (persistant).
    """
    result = AsyncResult(job_id, app=celery_app)
    celery_state = result.state.lower()

    try:
        status = JobStatus(celery_state)
        return StatusOut(
            job_id=job_id,
            status=status,
            details=str(result.info) if result.info else None
        )
    except ValueError:
        pass  # Si Celery ne reconnaît pas l’état (job terminé ou inconnu)

    # Fallback : lecture de status.json si la tâche a terminé
    status_path = JOBS_DIR / job_id / STATUS_FILENAME
    if status_path.exists():
        try:
            with open(status_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return StatusOut(
                job_id=job_id,
                status=JobStatus(data.get("status", "unknown")),
                details=data.get("details")
            )
        except Exception as e:
            raise HTTPException(500, f"Erreur lecture du status.json : {e}")

    # Aucun état trouvé
    raise HTTPException(status_code=404, detail="Job introuvable")
