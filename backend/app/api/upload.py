from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import List
import shutil, json
from app.models.job import JobOut, JobStatus
from app.utils.id_generator import generate_job_id
from app.utils.filename_utils import secure_filename
from app.config import config
from app.logger import logger
from worker.tasks import ocr_task
from pathlib import Path

router = APIRouter()

@router.post("/upload", response_model=JobOut)
async def upload_files(files: List[UploadFile] = File(...), file_ids: str = Form(...)):
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

    # Charger les file_ids venant du frontend
    try:
        file_ids = json.loads(file_ids)
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur parsing file_ids")
        raise HTTPException(status_code=400, detail="Format des file_ids invalide")

    # Sécuriser les noms pour file_ids.json
    fixed_file_ids = {}
    for original_name, file_id in file_ids.items():
        safe_name = secure_filename(original_name)
        fixed_file_ids[safe_name] = file_id

    # Sauvegarder file_ids.json
    file_ids_path = job_dir / "file_ids.json"
    try:
        with open(file_ids_path, "w", encoding="utf-8") as f:
            json.dump(fixed_file_ids, f)
        logger.info(f"[{job_id}] ✅ file_ids.json sauvegardé")
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur sauvegarde file_ids.json")
        raise HTTPException(status_code=500, detail=f"Erreur sauvegarde file_ids.json : {e}")

    # Sauvegarder les fichiers uploadés
    for file in files:
        safe_filename = secure_filename(file.filename)
        dest = job_in_dir / safe_filename

        try:
            with dest.open("wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            logger.info(f"[{job_id}] 📄 Fichier sauvegardé : {safe_filename}")
        except Exception as e:
            logger.exception(f"[{job_id}] ❌ Erreur lors de la sauvegarde de {safe_filename}")
            raise HTTPException(status_code=500, detail=f"Erreur sauvegarde fichier : {e}")

    # Lancer la tâche OCR avec Celery
    try:
        ocr_task.delay(job_id)
        logger.info(f"[{job_id}] 🚀 Tâche Celery lancée")
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur lancement tâche Celery")
        raise HTTPException(status_code=500, detail=f"Erreur Celery lancement tâche OCR : {e}")

    return JobOut(job_id=job_id, status=JobStatus.pending)
