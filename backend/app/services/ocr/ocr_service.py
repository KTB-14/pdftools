import os
import json
from pathlib import Path
import ocrmypdf
from app.config import config
from app.logger import logger


class OCRService:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job_dir = JOBS_ROOT / job_id
        self.input_dir = self.job_dir / INPUT_SUBDIR
        self.output_dir = self.job_dir / OUTPUT_SUBDIR
        self.status_file = self.job_dir / STATUS_FILENAME
        os.makedirs(self.output_dir, exist_ok=True)

    def _write_status(self, status: str, details: str = None):
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details
        }
        try:
            with open(self.status_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"[{self.job_id}] ❌ Erreur écriture status.json : {e}")

    def _is_tagged(self, pdf_path: Path) -> bool:
        try:
            with pikepdf.open(str(pdf_path)) as pdf:
                return "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
        except Exception as e:
            logger.warning(f"[{self.job_id}] ⚠️ Impossible de vérifier le tagging : {e}")
            return False

    def process(self) -> None:
        self._write_status("processing", "OCR en cours")
        try:
            for filename in os.listdir(self.input_dir):
                input_path = self.input_dir / filename
                stem = Path(filename).stem
                ext = Path(filename).suffix
                output_path = self.output_dir / f"{stem}_compressed{ext}"

                logger.info(f"[{self.job_id}] 🔍 Fichier en cours : {filename}")

                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    deskew=True,
                    optimize=3,
                    skip_text=True
                )

            self._write_status("done", "Traitement terminé avec succès")

        except Exception as e:
            logger.error(f"[{self.job_id}] ❌ Erreur traitement : {e}")
            self._write_status("error", str(e))
            raise
