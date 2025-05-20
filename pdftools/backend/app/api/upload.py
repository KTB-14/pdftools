from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil

from app.models.job import JobOut
from app.utils.id_generator import generate_job_id
from app.config import JOBS_DIR, INPUT_SUBDIR
from app.worker.tasks import ocr_task

from pathlib import Path

router = APIRouter()

@router.post("/upload", response_model=JobOut)
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Endpoint d’upload : reçoit un ou plusieurs fichiers PDF, les enregistre 
    dans un dossier temporaire unique (UUID_timestamp), puis lance un traitement asynchrone.
    """
    job_id = generate_job_id()
    job_dir = JOBS_DIR / job_id
    input_dir = job_dir / INPUT_SUBDIR

    try:
        input_dir.mkdir(parents=True, exist_ok=True)  # Création récursive du dossier
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur création du dossier : {e}")

    # Sauvegarde de chaque fichier dans le dossier input
    for file in files:
        dest = input_dir / file.filename
        try:
            with dest.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur sauvegarde fichier : {e}")

    # Lancement de la tâche asynchrone Celery
    try:
        ocr_task.delay(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lancement tâche OCR : {e}")

    return JobOut(job_id=job_id)
