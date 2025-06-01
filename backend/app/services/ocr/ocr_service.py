import os
import json
from pathlib import Path
import ocrmypdf
import pikepdf
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

    def _write_status(self, status: str, details: str = None, files: list = None):
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details,
            "files": files
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

            output_files = []

            for filename in files:
                input_path = self.input_dir / filename
                path = Path(filename)
                stem = path.stem
                suffix = path.suffix.lower()

                if suffix != '.pdf':
                    suffix = '.pdf'

                out_name = f"{stem}_compressed{suffix}"
                output_path = self.output_dir / out_name

                logger.info(f"[{self.job_id}] 🧾 OCR : {input_path.name} → {out_name}")

                # Détection "tagged PDF"
                try:
                    with pikepdf.open(str(input_path)) as pdf:
                        is_tagged = "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
                except Exception as e:
                    logger.warning(f"[{self.job_id}] ⚠️ Impossible de vérifier si PDF est taggé : {e}")
                    is_tagged = False

                if is_tagged:
                    logger.info(f"[{self.job_id}] 📌 PDF taggé → compression seule sans re-OCR")
                    ocr_args = {
                        "optimize": 3,
                        "redo_ocr": False,
                        "force_ocr": False,
                        "skip_text": True,
                        "output_type": "pdf"  
                    }
                else:
                    logger.info(f"[{self.job_id}] 🧾 PDF non taggé → OCR normal avec deskew et skip_text")
                    ocr_args = {
                        "optimize": 3,
                        "deskew": True,
                        "skip_text": True
                    }

                # 🚀 Traitement OCR ou compression
                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    **ocr_args
                )

                output_files.append(
                    {"original": filename, "output": out_name}
                )

                logger.info(f"[{self.job_id}] ✅ OCR terminé : {output_path.name}")

            self._write_status("done", "Traitement OCR terminé avec succès", output_files)

        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Erreur pendant le traitement OCR")
            self._write_status("error", str(e))
            raise 