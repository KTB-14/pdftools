from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import JOBS_DIR, ZIP_SUBDIR

from pathlib import Path

router = APIRouter()

@router.get("/download/{job_id}")
def download_archive(job_id: str):
    """
    Permet de télécharger l’archive ZIP générée après OCR.
    Le fichier se trouve dans : data/jobs/<job_id>/archives/<job_id>.zip
    """
    archive_path = JOBS_DIR / job_id / ZIP_SUBDIR / f"{job_id}.zip"

    if not archive_path.exists() or not archive_path.is_file():
        raise HTTPException(status_code=404, detail="Archive non trouvée. Traitement probablement en cours.")

    return FileResponse(
        path=str(archive_path),
        filename=f"{job_id}.zip",
        media_type="application/zip"
    )
