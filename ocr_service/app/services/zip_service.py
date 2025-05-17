import os
import zipfile
from ..config import OCR_ROOT, ZIP_SUBDIR

class ZipService:
    @staticmethod
    def make_archive(job_id: str) -> str:
        """
        Zippe tout le dossier output_ocr d'un job et renvoie le chemin vers le .zip généré.
        """
        job_dir = OCR_ROOT / job_id
        output_dir = job_dir / "output_ocr"
        zip_dir = job_dir / ZIP_SUBDIR
        os.makedirs(zip_dir, exist_ok=True)

        archive_path = zip_dir / f"{job_id}.zip"
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(output_dir):
                for file in files:
                    full_path = os.path.join(root, file)
                    arcname = os.path.relpath(full_path, output_dir)
                    zf.write(full_path, arcname)
        return str(archive_path)
