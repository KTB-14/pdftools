import os
import json
from pathlib import Path
import ocrmypdf
import pikepdf
from pikepdf import PasswordError, PdfError                # NEW
from ocrmypdf.exceptions import DigitalSignatureError      # NEW
from app.config import config
from app.logger import logger

MAX_FILE_SIZE_MB = 50                                       # NEW – limite max par fichier

class OCRService:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job_dir = config.OCR_ROOT / job_id
        self.input_dir = self.job_dir / config.INPUT_SUBDIR
        self.output_dir = self.job_dir / config.OUTPUT_SUBDIR
        self.status_file = self.job_dir / config.STATUS_FILENAME

        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"[{self.job_id}] 📁 Dossier de sortie vérifié : {self.output_dir}")

        # Charger uniquement file_ids pour status.json
        self.file_ids = {}
        file_ids_path = self.job_dir / "file_ids.json"
        if file_ids_path.exists():
            with open(file_ids_path, "r", encoding="utf-8") as f:
                self.file_ids = json.load(f)

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

                # ----------------------------- VALIDATIONS ----------------------------- #
                file_error: str | None = None                                         # NEW

                # 1) Taille max
                try:
                    size_before = os.path.getsize(input_path)                         # MOD (déplacé avant)
                    if size_before > MAX_FILE_SIZE_MB * 1024 * 1024:                 # NEW
                        file_error = f"Fichier trop volumineux (> {MAX_FILE_SIZE_MB} Mo)"  # NEW
                except Exception as e:                                               # NEW
                    file_error = f"Impossible de lire la taille : {e}"               # NEW

                # 2) Validité PDF + mot de passe
                if not file_error:                                                   # NEW
                    try:
                        with pikepdf.open(str(input_path)) as pdf:
                            if pdf.is_encrypted:                                     # NEW
                                file_error = "PDF protégé par mot de passe"          # NEW
                            is_tagged = "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
                    except PasswordError:                                            # NEW
                        file_error = "PDF protégé par mot de passe"
                    except PdfError:                                                 # NEW
                        file_error = "Fichier non-PDF ou PDF corrompu"
                    except Exception as e:                                           # NEW
                        file_error = f"Erreur ouverture PDF : {e}"

                # Si une erreur bloquante a été détectée, on ajoute l'entrée et on continue
                if file_error:                                                       # NEW
                    output_files.append({
                        "id"          : self.file_ids.get(filename, ""),
                        "original"    : filename,
                        "output"      : None,
                        "final_name"  : None,
                        "size_before" : None,
                        "size_after"  : None,
                        "ratio"       : None,
                        "error"       : file_error                                 # NEW
                    })
                    logger.warning(f"[{self.job_id}] ⛔ {filename} ignoré : {file_error}")  # NEW
                    continue                                                         # NEW

                # ----------------------- CHOIX DES ARGUMENTS OCR ---------------------- #
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

                # ----------------------------- TRAITEMENT OCR -------------------------- #
                try:                                                                 # NEW (bloc try)
                    ocrmypdf.ocr(
                        str(input_path),
                        str(output_path),
                        **ocr_args
                    )
                except DigitalSignatureError:                                        # NEW
                    file_error = "PDF signé numériquement – non modifié"
                except Exception as e:                                               # NEW
                    file_error = f"OCR impossible : {e}"

                # Si erreur pendant OCR, on enregistre l'échec et on poursuit la boucle
                if file_error:                                                       # NEW
                    output_files.append({
                        "id"          : self.file_ids.get(filename, ""),
                        "original"    : filename,
                        "output"      : None,
                        "final_name"  : None,
                        "size_before" : size_before,
                        "size_after"  : None,
                        "ratio"       : None,
                        "error"       : file_error
                    })
                    logger.warning(f"[{self.job_id}] ⛔ {filename} ignoré : {file_error}")
                    continue                                                         # NEW

                # ---------------- Calculs si OCR réussi ------------------------------ #
                output_size = os.path.getsize(output_path)                           # MOD (size_before déjà dispo)
                ratio = round(output_size / size_before * 100, 1)

                output_files.append({
                    "id": self.file_ids.get(filename, ""),
                    "original": filename,
                    "output": out_name,
                    "final_name": out_name,
                    "size_before": size_before,
                    "size_after": output_size,
                    "ratio": ratio,
                    "error": None                                                    # NEW (champ vide)
                })

                logger.info(f"[{self.job_id}] ✅ OCR terminé : {output_path.name}")

            self._write_status("done", "Traitement OCR terminé avec succès", output_files)

        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Erreur pendant le traitement OCR")
            self._write_status("error", str(e))
            raise
