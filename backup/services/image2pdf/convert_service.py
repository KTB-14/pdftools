import os
from PIL import Image
from common.logger import logger

class Image2PDFService:
    """
    Convertit un ensemble d’images en un unique PDF.
    Peut ensuite appeler OCRService si nécessaire.
    """

    def __init__(self, job_id: str, images: list[str]):
        self.job_id = job_id
        self.images = images

    def convert(self, output_pdf: str) -> None:
        imgs = [Image.open(p).convert("RGB") for p in self.images]
        imgs[0].save(output_pdf, save_all=True, append_images=imgs[1:])
        logger.info(f"Images → PDF : {output_pdf}")
        # Ici, on pourrait appeler OCRService si besoin
