"""
Ce module sera utilisé pour convertir des images (JPG, PNG) en un document PDF.
Il pourra être activé comme un nouveau service via une future route FastAPI.
"""

from pathlib import Path
from fpdf import FPDF  # ou reportlab, selon le moteur choisi

class Image2PDFService:
    """
    Convertit une liste d’images en un seul PDF.
    """

    @staticmethod
    def convert_images_to_pdf(image_paths: list[Path], output_pdf: Path):
        """
        Prend une liste de fichiers image et génère un PDF unique.
        """
        pdf = FPDF()
        for image_path in image_paths:
            pdf.add_page()
            pdf.image(str(image_path), x=10, y=10, w=190)  # Ajuster selon besoin
        pdf.output(str(output_pdf))
