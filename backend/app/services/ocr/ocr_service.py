"""Service métier réalisant l'OCR et la compression des PDF."""

import os
import json
from pathlib import Path
import ocrmypdf
import pikepdf
from pikepdf import PasswordError, PdfError  # EXISTANT
from ocrmypdf.exceptions import DigitalSignatureError  # EXISTANT
from app.config import config
from app.logger import logger

# =============================== OCR SERVICE =================================
# Classe prenant en charge l'OCR et la compression des PDF. Elle lit les
# fichiers d'entrée, applique ``ocrmypdf`` et écrit les résultats dans un
# ``status.json`` pour suivi par l'API.

MAX_FILE_SIZE_MB = 50  # EXISTANT

class OCRService:
    def __init__(self, job_id: str):
        """Prépare les chemins et charge le mapping ``file_ids``."""
        self.job_id = job_id
        self.job_dir = config.OCR_ROOT / job_id
        self.input_dir = self.job_dir / config.INPUT_SUBDIR
        self.output_dir = self.job_dir / config.OUTPUT_SUBDIR
        self.status_file = self.job_dir / config.STATUS_FILENAME

        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"[{self.job_id}] Dossier de sortie vérifié : {self.output_dir}")

        # Chargement du mapping des noms d'origine vers les IDs générés
        self.file_ids = {}
        file_ids_path = self.job_dir / "file_ids.json"
        if file_ids_path.exists():
            with open(file_ids_path, "r", encoding="utf-8") as f:
                self.file_ids = json.load(f)

    def _write_status(self, status: str, details: str = None, files: list = None):
        """Écrit ou met à jour le fichier ``status.json``."""
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details,
            "files": files,
        }
        try:
            with open(self.status_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            logger.info(f"[{self.job_id}] Status mis à jour : {status}")
        except Exception as e:
            logger.exception(f"[{self.job_id}] Échec écriture status.json : {e}")

    def process(self) -> None:
        """Boucle principale de traitement OCR."""
        self._write_status("processing", "OCR en cours")
        logger.info(f"[{self.job_id}] Début du traitement OCR")

        try:
            # Liste des fichiers à traiter
            files = list(os.listdir(self.input_dir))
            if not files:
                raise FileNotFoundError("Aucun fichier PDF trouvé dans le dossier d'entrée")

            output_files = []

            for filename in files:
                # Préparation des chemins pour ce fichier
                input_path = self.input_dir / filename
                path = Path(filename)
                stem = path.stem
                suffix = path.suffix.lower()

                if suffix != '.pdf':
                    suffix = '.pdf'

                out_name = f"{stem}_compressed{suffix}"
                output_path = self.output_dir / out_name

                logger.info(f"[{self.job_id}] OCR : {input_path.name} -> {out_name}")

                # ----------------------------- VALIDATIONS ----------------------------- #
                # Vérifie la taille et la validité du PDF avant OCR
                file_error: str | None = None 

                try:
                    size_before = os.path.getsize(input_path)  # EXISTANT
                    if size_before > MAX_FILE_SIZE_MB * 1024 * 1024:
                        file_error = "TOO_LARGE"  # NEW: code d'erreur
                except Exception as e:
                    file_error = "SIZE_READ_ERROR"  # NEW

                if not file_error:
                    try:
                        with pikepdf.open(str(input_path)) as pdf:
                            if pdf.is_encrypted:
                                file_error = "PASSWORD_PROTECTED"  # NEW
                            is_tagged = "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
                    except PasswordError:
                        file_error = "PASSWORD_PROTECTED"  # NEW
                    except PdfError:
                        file_error = "INVALID_PDF"  # NEW
                    except Exception:
                        file_error = "PDF_OPEN_ERROR"  # NEW

                if file_error:  # EXISTANT
                    output_files.append({
                        "id": self.file_ids.get(filename, ""),
                        "original": filename,
                        "output": None,
                        "final_name": None,
                        "size_before": None,
                        "size_after": None,
                        "ratio": None,
                        "error": file_error  # CODE
                    })
                    logger.warning(f"[{self.job_id}] Fichier ignoré {filename} : {file_error}")
                    continue

                # ----------------------- CHOIX DES ARGUMENTS OCR ---------------------- #
                if is_tagged:
                    logger.info(f"[{self.job_id}] PDF taggé : compression seule sans re-OCR")
                    ocr_args = {
                        "optimize": 3,
                        "redo_ocr": False,
                        "force_ocr": False,
                        "skip_text": True,
                        "output_type": "pdf"
                    }
                else:
                    logger.info(f"[{self.job_id}] PDF non taggé : OCR normal avec deskew et skip_text")
                    ocr_args = {
                        "optimize": 3,
                        "deskew": True,
                        "skip_text": True
                    }

                # ----------------------------- TRAITEMENT OCR -------------------------- #
                try:
                    ocrmypdf.ocr(
                        str(input_path),
                        str(output_path),
                        **ocr_args
                    )
                except DigitalSignatureError:
                    file_error = "SIGNED_PDF"  # CODE
                except Exception:
                    file_error = "OCR_FAILED"  # CODE

                if file_error:
                    output_files.append({
                        "id": self.file_ids.get(filename, ""),
                        "original": filename,
                        "output": None,
                        "final_name": None,
                        "size_before": size_before,
                        "size_after": None,
                        "ratio": None,
                        "error": file_error
                    })
                    logger.warning(f"[{self.job_id}] Fichier ignoré {filename} : {file_error}")
                    continue

                output_size = os.path.getsize(output_path)
                ratio = round(output_size / size_before * 100, 1)

                output_files.append({
                    "id": self.file_ids.get(filename, ""),
                    "original": filename,
                    "output": out_name,
                    "final_name": out_name,
                    "size_before": size_before,
                    "size_after": output_size,
                    "ratio": ratio,
                    "error": None
                })

                logger.info(f"[{self.job_id}] OCR terminé : {output_path.name}")

            self._write_status("done", "Traitement OCR terminé avec succès", output_files)
            # Status final écrit : ``done`` avec la liste détaillée des fichiers

        except Exception as e:
            logger.exception(f"[{self.job_id}] Erreur pendant le traitement OCR")
            self._write_status("error", str(e))
            raise

