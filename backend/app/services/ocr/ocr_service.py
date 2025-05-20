import os
import json
from pathlib import Path
import ocrmypdf
from app.config import JOBS_ROOT, INPUT_SUBDIR, OUTPUT_SUBDIR, STATUS_FILENAME
from app.logger import logger

class OCRService:
    """
    Service métier dédié au traitement OCR et à la compression de fichiers PDF
    à l’aide de la bibliothèque ocrmypdf.
    """

    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job_dir = JOBS_ROOT / job_id
        self.input_dir = self.job_dir / INPUT_SUBDIR
        self.output_dir = self.job_dir / OUTPUT_SUBDIR
        self.status_file = self.job_dir / STATUS_FILENAME

        # Assure que le dossier de sortie existe
        os.makedirs(self.output_dir, exist_ok=True)

    def _write_status(self, status: str, details: str = None):
        """
        Écrit un fichier status.json pour tracer l’état du job à tout moment.
        """
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details
        }
        try:
            with open(self.status_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Échec écriture status.json pour {self.job_id} : {e}")

    def process(self) -> None:
        """
        Exécute le traitement OCR sur chaque fichier PDF du dossier input_ocr.
        Chaque fichier est converti et compressé en suffixant _compressed.pdf.
        """
        self._write_status("processing", "OCR en cours")

        try:
            for filename in os.listdir(self.input_dir):
                input_path = self.input_dir / filename

                # Nom de sortie avec suffixe
                stem = Path(filename).stem
                ext = Path(filename).suffix
                output_path = self.output_dir / f"{stem}_compressed{ext}"

                logger.info(f"OCR processing {input_path} → {output_path}")

                # Appel OCRmyPDF avec options standard
                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    deskew=True,
                    optimize=3,
                    skip_text=True  # Ne refait pas l’OCR si du texte existe déjà
                )

                logger.info(f"✔ OCR terminé : {output_path}")

            self._write_status("done", "Traitement OCR terminé avec succès")

        except Exception as e:
            logger.error(f"❌ Erreur OCR : {e}")
            self._write_status("error", str(e))
            raise
