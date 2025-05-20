import os, zipfile
from common.config import OCR_ROOT, ZIP_SUBDIR

class ZipService:
    """Zippe le contenu de output_ocr/ puis renvoie le chemin du .zip."""

    @staticmethod
    def make_archive(job_id: str) -> str:
        job_dir    = OCR_ROOT / job_id
        output_dir = job_dir / "output_ocr"
        zip_dir    = job_dir / ZIP_SUBDIR
        os.makedirs(zip_dir, exist_ok=True)

        archive_path = zip_dir / f"{job_id}.zip"
        with zipfile.ZipFile(archive_path, 'w', zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(output_dir):
                for fname in files:
                    full = os.path.join(root, fname)
                    arc  = os.path.relpath(full, output_dir)
                    zf.write(full, arc)
        return str(archive_path)
