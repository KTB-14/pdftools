import os
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
        """
        for filename in os.listdir(self.input_dir):
            input_path = self.input_dir / filename
            output_path = self.output_dir / filename
            try:
                logger.info(f"OCR processing {input_path}")
                ocrmypdf.ocr(
                    str(input_path),
                    str(output_path),
                    deskew=True,
                    optimize=3  # compression
                )
                logger.info(f"OCR done for {input_path}")
            except Exception as e:
                logger.error(f"Error OCRing {input_path}: {e}")
                raise
