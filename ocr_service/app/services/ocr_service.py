import os
import json
from typing import List
import ocrmypdf
from ..config import OCR_ROOT, INPUT_SUBDIR, OUTPUT_SUBDIR
from ..utils.logger import logger

class OCRService:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job_dir = OCR_ROOT / job_id
        self.input_dir = self.job_dir / INPUT_SUBDIR
        self.output_dir = self.job_dir / OUTPUT_SUBDIR
        self.status_file = self.job_dir / "status.json"
        os.makedirs(self.output_dir, exist_ok=True)

    def _write_status(self, status: str, details: str = None):
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details
        }
        try:
            with open(self.status_file, "w") as f:
                json.dump(data, f)
        except Exception as e:
            logger.error(f"Failed to write status.json: {e}")

    def process(self) -> None:
        self._write_status("processing", "OCR started")
        try:
            for filename in os.listdir(self.input_dir):
                input_path = self.input_dir / filename
                output_path = self.output_dir / filename
                logger.info(f"OCR processing {input_path}")
                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    deskew=True,
                    optimize=3
                )
                logger.info(f"OCR done for {input_path}")

            self._write_status("done", "OCR completed successfully")

        except Exception as e:
            logger.error(f"Error OCRing {input_path}: {e}")
            self._write_status("error", str(e))
            raise
