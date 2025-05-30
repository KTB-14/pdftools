from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil
from app.models.job import JobOut, JobStatus
from app.utils.id_generator import generate_job_id
from app.config import config
from app.logger import logger
from worker.tasks import ocr_task
from pathlib import Path

router = APIRouter()

@router.post("/upload", response_model=JobOut)
async def upload_files(files: List[UploadFile] = File(...)):
    job_id = generate_job_id()
    job_dir = config.OCR_ROOT / job_id
    job_in_dir = job_dir / config.INPUT_SUBDIR

    logger.info(f"[{job_id}] 📥 Nouvelle requête d'upload reçue")
    logger.info(f"[{job_id}] 📁 Dossier prévu pour les fichiers : {job_in_dir}")

    try:
        job_in_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"[{job_id}] ✅ Dossier de destination créé")
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur création du dossier")
        raise HTTPException(status_code=500, detail=f"Erreur création du dossier : {e}")

    for file in files:
        dest = job_in_dir / file.filename
        try:
            with dest.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"[{job_id}] 📄 Fichier sauvegardé : {file.filename}")
        except Exception as e:
            logger.exception(f"[{job_id}] ❌ Erreur lors de la sauvegarde de {file.filename}")
            raise HTTPException(status_code=500, detail=f"Erreur sauvegarde fichier : {e}")

    try:
        ocr_task.delay(job_id)
        logger.info(f"[{job_id}] 🚀 Tâche Celery lancée")
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur lancement tâche Celery")
        raise HTTPException(status_code=500, detail=f"Erreur Celery lancement tâche OCR : {e}")

    return JobOut(job_id=job_id, status=JobStatus.pending)
