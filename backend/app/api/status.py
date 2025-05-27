from fastapi import APIRouter, HTTPException
from app.models.job import StatusOut, JobStatus
from celery.result import AsyncResult
from worker.tasks import celery_app
from app.config import config
from app.logger import logger
import json
from pathlib import Path

router = APIRouter()

@router.get("/status/{job_id}", response_model=StatusOut)
def get_status(job_id: str) -> StatusOut:
    logger.info(f"[{job_id}] 🔍 Requête de statut reçue")

    # Tentative de récupération du statut via Celery
    result = AsyncResult(job_id, app=celery_app)
    celery_state = result.state.lower()

    try:
        status = JobStatus(celery_state)
        logger.info(f"[{job_id}] ✅ Statut Celery reconnu : {status}")

        return StatusOut(
            job_id=job_id,
            status=status,
            details=str(result.info) if result.info else None,
            files=None  # Pas de liste de fichiers côté Celery
        )

    except ValueError:
        # Si Celery ne connaît plus le job (terminé, expiré...), on passe au fallback
        logger.warning(f"[{job_id}] ⚠️ Statut Celery inconnu ou terminé – fallback vers status.json")

    # Fallback : lecture du fichier status.json
    status_path = config.OCR_ROOT / job_id / config.STATUS_FILENAME
    if status_path.exists():
        try:
            with open(status_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            logger.info(f"[{job_id}] 📄 Lecture réussie de status.json")
            logger.debug(f"[{job_id}] 🔁 Contenu lu : {data}")

            return StatusOut(
                job_id=job_id,
                status=JobStatus(data.get("status", "unknown")),
                details=data.get("details"),
                files=data.get("files")
            )

        except Exception as e:
            logger.exception(f"[{job_id}] ❌ Erreur lecture status.json : {e}")
            raise HTTPException(status_code=500, detail=f"Erreur lecture status.json : {str(e)}")

    # Aucun statut trouvé
    logger.error(f"[{job_id}] ❌ Aucune information de statut trouvée")
    raise HTTPException(status_code=404, detail="Job non trouvé")
