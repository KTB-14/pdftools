from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import config
from app.logger import logger
from pathlib import Path

router = APIRouter()

@router.get("/download/{job_id}")
def download_pdf(job_id: str):
    """
    Renvoie directement le fichier PDF traité, sans archive ZIP.
    """
    output_dir = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR

    logger.info(f"[{job_id}] 📥 Demande de téléchargement du PDF OCRisé")

    if not output_dir.exists():
        logger.warning(f"[{job_id}] ❌ Dossier de sortie introuvable : {output_dir}")
        raise HTTPException(status_code=404, detail="Résultat introuvable")

    pdf_files = list(output_dir.glob("*.pdf"))
    if not pdf_files:
        logger.warning(f"[{job_id}] ❌ Aucun PDF trouvé dans {output_dir}")
        raise HTTPException(status_code=404, detail="Fichier PDF non trouvé")

    pdf_path = pdf_files[0]  # On suppose qu’un seul fichier PDF est généré
    logger.info(f"[{job_id}] ✅ Fichier PDF trouvé : {pdf_path.name}")

    return FileResponse(
        path=str(pdf_path),
        filename=pdf_path.name,
        media_type="application/pdf"
    )
