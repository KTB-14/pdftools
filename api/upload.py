from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import shutil
from common.id_generator import generate_job_id
from common.config import OCR_ROOT, INPUT_SUBDIR
from models.job import JobOut
from worker.tasks import ocr_task

router = APIRouter()

@router.post("/upload", response_model=JobOut)
async def upload_files(files: List[UploadFile] = File(...)):
    """
    - Génère un job_id unique.
    - Crée /ocr_files/{job_id}/input_ocr/
    - Sauvegarde les fichiers uploadés.
    - LANCE la tâche Celery ocr_task.delay(job_id).
    - Renvoie {"job_id": "..."}.
    """
    job_id     = generate_job_id()
    job_dir    = OCR_ROOT / job_id
    input_dir  = job_dir / INPUT_SUBDIR

    try:
        input_dir.mkdir(parents=True, exist_ok=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Impossible de créer {input_dir}: {e}")

    for f in files:
        dest = input_dir / f.filename
        with dest.open("wb") as buf:
            shutil.copyfileobj(f.file, buf)

    try:
        ocr_task.delay(job_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur démarrage Celery: {e}")

    return JobOut(job_id=job_id)
