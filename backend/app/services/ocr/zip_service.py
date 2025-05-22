import os
import zipfile
from app.config import config
from app.logger import logger
from pathlib import Path

class ZipService:
    @staticmethod
    def make_archive(job_id: str) -> str:
        """
        Zippe tout le dossier output_ocr d'un job et renvoie le chemin vers le .zip généré.
        """
        job_dir = config.OCR_ROOT / job_id
        output_dir = job_dir / config.OUTPUT_SUBDIR
        zip_dir = job_dir / config.ZIP_SUBDIR
        os.makedirs(zip_dir, exist_ok=True)

        archive_path = zip_dir / f"{job_id}.zip"
        logger.info(f"[{job_id}] 📦 Création de l'archive : {archive_path}")

        try:
            file_count = 0
            with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
                for root, _, files in os.walk(output_dir):
                    for file in files:
                        full_path = os.path.join(root, file)
                        arcname = os.path.relpath(full_path, output_dir)
                        zf.write(full_path, arcname)
                        file_count += 1
            logger.info(f"[{job_id}] ✅ Archive créée avec {file_count} fichier(s)")
            return str(archive_path)

        except Exception as e:
            logger.exception(f"[{job_id}] ❌ Erreur lors de la création de l'archive : {e}")
            raise
