"""Endpoints de téléchargement des PDF générés."""

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import config
from app.logger import logger
import json

# ============================== ENDPOINT DOWNLOAD ============================
# Permet de récupérer un ou plusieurs fichiers PDF générés après OCR. Deux
# routes sont exposées :
#  - ``/download/{job_id}`` renvoie directement le fichier s'il est unique ;
#  - ``/download/{job_id}/file/{file_id}`` permet de choisir un fichier précis.

router = APIRouter()

@router.get("/download/{job_id}")
def download_single_or_multiple(job_id: str):
    """Télécharge le PDF généré. Redirige vers le second endpoint en cas de
    fichiers multiples."""
    output_dir = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR
    status_path = config.OCR_ROOT / job_id / config.STATUS_FILENAME

    logger.info(f"[{job_id}] Demande de téléchargement")

    if not output_dir.exists():
        raise HTTPException(status_code=404, detail="Dossier de sortie introuvable")

    try:
        # Liste tous les PDF présents dans le dossier de sortie
        files = list(output_dir.glob("*.pdf"))
        if not files:
            raise FileNotFoundError("Aucun fichier PDF disponible")

        if len(files) == 1:
            file = files[0]
            logger.info(f"[{job_id}] Un seul fichier trouvé : {file.name}")
            return FileResponse(
                path=str(file),
                filename=file.name,
                media_type="application/pdf"
            )
        else:
            logger.warning(f"[{job_id}] Plusieurs fichiers détectés, demande redirigée")
            # On informe le client qu'il doit passer par l'endpoint spécifique
            raise HTTPException(status_code=409, detail="Plusieurs fichiers disponibles. Utilisez /download/{job_id}/{file_id}")
    except Exception as e:
        logger.exception(f"[{job_id}] Erreur pendant la tentative de téléchargement : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur : {e}")

@router.get("/download/{job_id}/file/{file_id}")
def download_by_file_id(job_id: str, file_id: str):
    """Télécharge un fichier précis via son ``file_id``."""
    status_path = config.OCR_ROOT / job_id / config.STATUS_FILENAME
    if not status_path.exists():
        # Pas de status → le job n'existe plus ou pas encore démarré
        raise HTTPException(status_code=404, detail="Status non trouvé")

    try:
        # On lit ``status.json`` pour retrouver le nom de fichier généré
        with open(status_path, "r", encoding="utf-8") as f:
            status_data = json.load(f)

        # Recherche de l'entrée correspondant à ``file_id``
        file_entry = next(
            (f for f in status_data.get("files", []) if f["id"] == file_id),
            None
        )

        if not file_entry:
            # L'ID demandé n'est pas référencé dans status.json
            raise HTTPException(status_code=404, detail="Fichier non trouvé pour cet ID")

        output_name = file_entry.get("output")
        if not output_name:
            # Aucun fichier généré (probablement en erreur)
            raise HTTPException(status_code=404, detail="Fichier compressé introuvable pour cet ID")

        final_name = file_entry.get("final_name", output_name) 
        file_path = config.OCR_ROOT / job_id / config.OUTPUT_SUBDIR / output_name

        if not file_path.exists():
            # Fichier absent du disque : peut-être déjà purgé
            raise HTTPException(status_code=404, detail="Fichier compressé introuvable")

        # Envoi du fichier au client
        return FileResponse(
            path=str(file_path),
            filename=final_name,
            media_type="application/pdf"
        )
    except HTTPException:
            raise
    except Exception as e:
        logger.exception(f"[{job_id}] Erreur pendant le téléchargement par ID : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur : {str(e)}")
    
