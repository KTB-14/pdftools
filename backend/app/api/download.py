from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import config
from app.logger import logger
from pathlib import Path

router = APIRouter()

@router.get("/download/{job_id}")
def download_archive(job_id: str):
    """
    Permet de télécharger l'archive ZIP du job si elle a été générée avec succès.
    """
    archive_path = config.OCR_ROOT / job_id / config.ZIP_SUBDIR / f"{job_id}.zip"

    logger.info(f"[{job_id}] 📨 Demande de téléchargement de l'archive ZIP")

    if not archive_path.exists() or not archive_path.is_file():
        logger.warning(f"[{job_id}] ❌ Archive non trouvée à {archive_path}")
        raise HTTPException(status_code=404, detail="Archive non trouvée. Traitement probablement en cours.")

    logger.info(f"[{job_id}] ✅ Archive trouvée, envoi du fichier")
    return FileResponse(
        path=str(archive_path),
        filename=f"{job_id}.zip",
        media_type="application/zip"
    )
