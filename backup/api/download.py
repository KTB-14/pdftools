from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from common.config import OCR_ROOT, ZIP_SUBDIR
from pathlib import Path

router = APIRouter()

@router.get("/download/{job_id}")
def download_archive(job_id: str):
    """
    Renvoie le ZIP /ocr_files/{job_id}/archives/{job_id}.zip
    ou 404 si non trouvé.
    """
    archive = OCR_ROOT / job_id / ZIP_SUBDIR / f"{job_id}.zip"
    if not (archive.exists() and archive.is_file()):
        raise HTTPException(status_code=404,
                            detail="Archive introuvable ou traitement en cours")
    return FileResponse(path=str(archive),
                        filename=f"{job_id}.zip",
                        media_type="application/zip")
