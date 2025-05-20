import os
import zipfile
from app.config import JOBS_ROOT, OUTPUT_SUBDIR, ZIP_SUBDIR

class ZipService:
    """
    Service responsable de l’archivage ZIP des fichiers compressés
    générés après OCR. Le fichier ZIP est ensuite téléchargeable.
    """

    @staticmethod
    def make_archive(job_id: str) -> str:
        """
        Crée une archive ZIP à partir du dossier output_ocr.
        Retourne le chemin absolu de l’archive générée.
        """
        job_dir = JOBS_ROOT / job_id
        output_dir = job_dir / OUTPUT_SUBDIR
        zip_dir = job_dir / ZIP_SUBDIR
        os.makedirs(zip_dir, exist_ok=True)

        archive_path = zip_dir / f"{job_id}.zip"

        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(output_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, output_dir)  # structure propre dans le ZIP
                    zf.write(full_path, arcname)

        return str(archive_path)
