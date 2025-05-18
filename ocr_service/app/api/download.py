from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from ..config import OCR_ROOT, ZIP_SUBDIR
from pathlib import Path

router = APIRouter()

@router.get("/download/{job_id}")
def download_archive(job_id: str):
    archive_path = OCR_ROOT / job_id / ZIP_SUBDIR / f"{job_id}.zip"
    if not archive_path.exists() or not archive_path.is_file():
        raise HTTPException(status_code=404, detail="Archive non trouvée. Le traitement n’est peut-être pas terminé.")
    return FileResponse(
        path=str(archive_path),
        filename=f"{job_id}.zip",
        media_type="application/zip"
    )
