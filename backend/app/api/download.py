from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from app.config import config
from app.logger import logger
from pathlib import Path
from typing import List

router = APIRouter()

@router.get("/download/{job_id}")
def list_available_files(job_id: str):
    """
    Liste les fichiers PDF OCR disponibles pour un job donné.
    """
    output_dir = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR

    logger.info(f"[{job_id}] 📄 Requête de liste des fichiers OCRisés")

    if not output_dir.exists():
        logger.warning(f"[{job_id}] ❌ Dossier output_ocr introuvable")
        raise HTTPException(status_code=404, detail="Job non trouvé ou pas encore traité")

    pdf_files: List[str] = [f.name for f in output_dir.glob("*.pdf")]

    if not pdf_files:
        logger.warning(f"[{job_id}] ❌ Aucun fichier PDF trouvé")
        raise HTTPException(status_code=404, detail="Aucun fichier PDF disponible")

    logger.info(f"[{job_id}] ✅ {len(pdf_files)} fichier(s) PDF trouvé(s)")
    return JSONResponse(content={"job_id": job_id, "files": pdf_files})


@router.get("/download/{job_id}/{filename}")
def download_file(job_id: str, filename: str):
    """
    Permet de télécharger un fichier PDF OCRisé spécifique d’un job donné.
    """
    file_path = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR / filename

    logger.info(f"[{job_id}] 📨 Requête de téléchargement : {filename}")

    if not file_path.exists() or not file_path.is_file():
        logger.warning(f"[{job_id}] ❌ Fichier introuvable : {file_path}")
        raise HTTPException(status_code=404, detail="Fichier non trouvé")

    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="application/pdf"
    )
