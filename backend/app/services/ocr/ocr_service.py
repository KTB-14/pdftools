import os
import json
from pathlib import Path
import ocrmypdf
from app.config import config
from app.logger import logger

class OCRService:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job_dir = config.OCR_ROOT / job_id
        self.input_dir = self.job_dir / config.INPUT_SUBDIR
        self.output_dir = self.job_dir / config.OUTPUT_SUBDIR
        self.status_file = self.job_dir / config.STATUS_FILENAME

        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"[{self.job_id}] 📁 Dossier de sortie vérifié : {self.output_dir}")

    def _write_status(self, status: str, details: str = None):
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details
        }
        try:
            with open(self.status_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            logger.info(f"[{self.job_id}] 📝 Status mis à jour : {status}")
        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Échec écriture status.json : {e}")

    def process(self) -> None:
        self._write_status("processing", "OCR en cours")
        logger.info(f"[{self.job_id}] 🚀 Début du traitement OCR")

        try:
            files = list(os.listdir(self.input_dir))
            if not files:
                raise FileNotFoundError("Aucun fichier PDF trouvé dans le dossier d'entrée")

            for filename in files:
                input_path = self.input_dir / filename
                stem = Path(filename).stem
                ext = Path(filename).suffix
                out_name = f"{stem}_compressed{ext}"
                output_path = self.output_dir / out_name

                logger.info(f"[{self.job_id}] 🧾 OCR : {input_path.name} → {out_name}")

                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    deskew=True,
                    optimize=3,
                    skip_text=True
                )

                logger.info(f"[{self.job_id}] ✅ OCR terminé : {output_path.name}")

            self._write_status("done", "Traitement OCR terminé avec succès")

        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Erreur pendant le traitement OCR")
            self._write_status("error", str(e))
            raise
