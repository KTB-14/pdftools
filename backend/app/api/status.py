"""Endpoint de consultation du statut d'un traitement OCR."""

from fastapi import APIRouter, HTTPException
from app.models.job import StatusOut, JobStatus
from app.config import config
from app.logger import logger
import json

# =============================== ENDPOINT STATUS =============================
# Consulte ``status.json`` pour connaître l'état d'un job. Utilisé par le
# frontend pour savoir quand les fichiers sont prêts.

router = APIRouter()

@router.get("/status/{job_id}", response_model=StatusOut)
def get_status(job_id: str):
    """Retourne le contenu du fichier ``status.json`` associé au job."""
    logger.info(f"[{job_id}] Requête de statut reçue")

    # Lecture directe du fichier status.json généré par OCRService
    status_path = config.OCR_ROOT / job_id / config.STATUS_FILENAME
    if status_path.exists():
        try:
            with open(status_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            logger.info(f"[{job_id}] Lecture réussie de status.json")
            return StatusOut(
                job_id=job_id,
                status=JobStatus(data.get("status", "unknown")),
                details=data.get("details"),
                files=data.get("files")
            )
        except Exception as e:
            logger.exception(f"[{job_id}] Erreur lecture status.json : {e}")
            raise HTTPException(status_code=500, detail=f"Erreur lecture status.json : {str(e)}")

    logger.warning(f"[{job_id}] Aucune info de statut trouvée")
    # Si aucun status.json n'est présent, le job est inconnu ou expiré
    raise HTTPException(status_code=404, detail="Job non trouvé")
 
