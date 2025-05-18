from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil
from ..models.job import JobOut
from ..utils.id_generator import generate_job_id
from ..config import OCR_ROOT, INPUT_SUBDIR
from worker.tasks import ocr_task

router = APIRouter()

@router.post("/upload", response_model=JobOut)
async def upload_files(files: List[UploadFile] = File(...)):
    job_id      = generate_job_id()
    job_dir     = OCR_ROOT / job_id
    job_in_dir  = job_dir / INPUT_SUBDIR

    # création des dossiers
    try:
        job_in_dir.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        raise HTTPException(500, f"Erreur création dossier: {e}")

    # Sauvegarde fichiers
    for file in files:
        dest = job_in_dir / file.filename
        with dest.open("wb") as buf:
            shutil.copyfileobj(file.file, buf)

    # Lancement Celery
    try:
        ocr_task.delay(job_id)
    except Exception as e:
        raise HTTPException(500, f"Erreur Celery: {e}")

    return JobOut(job_id=job_id)
