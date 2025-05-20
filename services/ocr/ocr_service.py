import os, json
from pathlib import Path
import ocrmypdf
from common.config import OCR_ROOT, INPUT_SUBDIR, OUTPUT_SUBDIR, STATUS_FILENAME
from common.logger import logger

class OCRService:
    """
    Service OCR + compression :
      - Lit tous les fichiers dans input_ocr/
      - Applique ocrmypdf.ocr(...)
      - Génère output_ocr/<nom>_compressed.pdf
      - Met à jour status.json
    """

    def __init__(self, job_id: str):
        self.job_id      = job_id
        self.job_dir     = OCR_ROOT / job_id
        self.input_dir   = self.job_dir / INPUT_SUBDIR
        self.output_dir  = self.job_dir / OUTPUT_SUBDIR
        self.status_file = self.job_dir / STATUS_FILENAME
        os.makedirs(self.output_dir, exist_ok=True)

    def _write_status(self, status: str, details: str = None):
        """Écrit un JSON de statut dans status.json."""
        data = {"job_id": self.job_id, "status": status, "details": details}
        try:
            with open(self.status_file, "w") as f:
                json.dump(data, f)
        except Exception as e:
            logger.error(f"Impossible d’écrire {self.status_file}: {e}")

    def process(self) -> None:
        """Lance le traitement OCR sur tous les PDF du dossier input."""
        self._write_status("processing", "Début du traitement OCR")
        try:
            for filename in os.listdir(self.input_dir):
                in_path = self.input_dir / filename
                stem, ext = Path(filename).stem, Path(filename).suffix
                out_name  = f"{stem}_compressed{ext}"
                out_path  = self.output_dir / out_name

                logger.info(f"OCR: {in_path} → {out_path}")
                ocrmypdf.ocr(
                    str(in_path),
                    str(out_path),
                    deskew=True,
                    optimize=3,      # compression
                    skip_text=True  # ne pas ré-OCR le texte existant
                )
                logger.info(f"OCR terminé: {out_path}")

            self._write_status("done", "Traitement terminé avec succès")
        except Exception as e:
            logger.error(f"Erreur OCR {in_path}: {e}")
            self._write_status("error", str(e))
            raise
