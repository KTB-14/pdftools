import os
import json
from typing import List
import ocrmypdf
from ..config import OCR_ROOT, INPUT_SUBDIR, OUTPUT_SUBDIR
from ..utils.logger import logger

class OCRService:
    def __init__(self, job_id: str):
        self.job_dir = OCR_ROOT / job_id
        self.input_dir = self.job_dir / INPUT_SUBDIR
        self.output_dir = self.job_dir / OUTPUT_SUBDIR
        os.makedirs(self.output_dir, exist_ok=True)

    def process(self) -> None:
        """
        Parcourt chaque PDF dans input_dir, applique l'OCR et enregistre dans output_dir.
        Enregistre aussi un fichier status.json pour suivre l'état du job.
        """
        try:
            for filename in os.listdir(self.input_dir):
                input_path = self.input_dir / filename
                output_path = self.output_dir / filename
                logger.info(f"OCR processing {input_path}")
                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    deskew=True,
                    optimize=3  # compression
                )
                logger.info(f"OCR done for {input_path}")
            
            # ✅ Sauvegarder le statut du job après succès
            status = {
                "job_id": self.job_dir.name,
                "status": "done"
            }
            with open(self.job_dir / "status.json", "w") as f:
                json.dump(status, f)

        except Exception as e:
            logger.error(f"Error OCRing {input_path}: {e}")

            # ❌ Enregistrer aussi l'erreur dans status.json
            status = {
                "job_id": self.job_dir.name,
                "status": "error",
                "details": str(e)
            }
            with open(self.job_dir / "status.json", "w") as f:
                json.dump(status, f)
            
            raise
