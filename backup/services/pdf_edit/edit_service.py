from PyPDF2 import PdfMerger
from common.logger import logger

class PDFEditService:
    """Exemples de manipulations : fusion, split, watermark…"""

    def merge(self, inputs: list[str], output: str) -> None:
        merger = PdfMerger()
        for pdf in inputs:
            merger.append(pdf)
            logger.info(f"Fusionné : {pdf}")
        merger.write(output)
        merger.close()
        logger.info(f"PDF fusionné → {output}")
