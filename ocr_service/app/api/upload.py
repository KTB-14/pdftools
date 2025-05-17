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
    job_id = generate_job_id()
    job_input_dir = OCR_ROOT / job_id / INPUT_SUBDIR
    job_input_dir.mkdir(parents=True, exist_ok=True)

    # Sauvegarde des fichiers
    for file in files:
        dest = job_input_dir / file.filename
        with dest.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

    # Lancer la tâche asynchrone Celery
    try:
        ocr_task.delay(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur Celery: {e}")

    return JobOut(job_id=job_id)
