from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import config
from app.logger import logger
from pathlib import Path
import json

router = APIRouter()

@router.get("/download/{job_id}")
def download_single_or_multiple(job_id: str):
    """
    Si un seul fichier a été généré → téléchargement direct.
    Sinon → inviter à utiliser /download/{job_id}/{filename}
    """
    output_dir = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR
    status_path = config.OCR_ROOT / job_id / config.STATUS_FILENAME

    logger.info(f"[{job_id}] 📨 Demande de téléchargement")

    if not output_dir.exists():
        raise HTTPException(status_code=404, detail="Dossier de sortie introuvable")

    try:
        files = list(output_dir.glob("*.pdf"))
        if not files:
            raise FileNotFoundError("Aucun fichier PDF disponible")

        if len(files) == 1:
            file = files[0]
            logger.info(f"[{job_id}] ✅ Un seul fichier trouvé : {file.name}")
            return FileResponse(
                path=str(file),
                filename=file.name,
                media_type="application/pdf"
            )
        else:
            logger.warning(f"[{job_id}] ⚠️ Plusieurs fichiers détectés → demande redirigée")
            raise HTTPException(status_code=409, detail="Plusieurs fichiers disponibles. Utilisez /download/{job_id}/{filename}")
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur pendant la tentative de téléchargement : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur : {e}")


@router.get("/download/{job_id}/{original_name}")
def download_specific_file(job_id: str, original_name: str):
    status_path = config.OCR_ROOT / job_id / config.STATUS_FILENAME
    if not status_path.exists():
        raise HTTPException(status_code=404, detail="Status non trouvé")

    try:
        with open(status_path, "r", encoding="utf-8") as f:
            status_data = json.load(f)

        file_entry = next(
            (f for f in status_data.get("files", []) if f["original"] == original_name),
            None
        )

        if not file_entry:
            raise HTTPException(status_code=404, detail="Fichier non trouvé dans le status")

        file_path = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR / file_entry["output"]

        if not file_path.exists():
            raise HTTPException(status_code=404, detail="Fichier compressé non trouvé")

        return FileResponse(
            path=str(file_path),
            filename=original_name,
            media_type="application/pdf"
        )

    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur pendant le téléchargement : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur : {str(e)}")
