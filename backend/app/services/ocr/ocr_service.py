import os
import json
import signal
from pathlib import Path
import ocrmypdf
import pikepdf
from app.config import config
from app.logger import logger

class TimeoutException(Exception):
    pass

def timeout_handler(signum, frame):
    raise TimeoutException("OCR timeout exceeded")

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

    def _pdf_has_text(self, pdf_path: Path) -> bool:
        try:
            with pikepdf.open(str(pdf_path)) as pdf:
                for page in pdf.pages:
                    if "/Contents" in page.obj:
                        return True
        except Exception as e:
            logger.warning(f"[{self.job_id}] ⚠️ Impossible de vérifier le texte dans le PDF : {e}")
        return False

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
                stem = Path(filename).stem
                ext = Path(filename).suffix
                out_name = f"{stem}_compressed{ext}"
                output_path = self.output_dir / out_name

                logger.info(f"[{self.job_id}] 🧾 Analyse du PDF : {input_path.name}")

                # Vérification tagging + texte
                try:
                    with pikepdf.open(str(input_path)) as pdf:
                        is_tagged = "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
                except Exception as e:
                    logger.warning(f"[{self.job_id}] ⚠️ Erreur lors de la lecture du PDF : {e}")
                    is_tagged = False

                has_text = self._pdf_has_text(input_path)
                logger.info(f"[{self.job_id}] 📌 Taggé : {is_tagged} | Texte détecté : {has_text}")

                ocr_args = {
                    "optimize": 3
                }

                if not has_text and not is_tagged:
                    logger.info(f"[{self.job_id}] ➤ PDF non taggé sans texte → OCR classique")
                    ocr_args.update({"deskew": True, "skip_text": True})

                elif not has_text and is_tagged:
                    logger.info(f"[{self.job_id}] ➤ PDF taggé sans texte → tentative redo_ocr avec timeout")

                    signal.signal(signal.SIGALRM, timeout_handler)
                    signal.alarm(20)

                    try:
                        ocr_args.update({"redo_ocr": True})
                        ocrmypdf.ocr(str(input_path), str(output_path), **ocr_args)
                        signal.alarm(0)
                        logger.info(f"[{self.job_id}] ✅ OCR (redo) terminé : {output_path.name}")
                        output_files.append(out_name)
                        continue
                    except TimeoutException:
                        logger.warning(f"[{self.job_id}] ⏱️ OCR bloqué sur redo_ocr → compression seule")
                        logger.info(f"[{self.job_id}] 🗜️ Compression forcée après échec redo_ocr")
                    except Exception as e:
                        logger.warning(f"[{self.job_id}] ⚠️ Échec redo_ocr : {e}")
                        logger.info(f"[{self.job_id}] 🗜️ Compression forcée après échec redo_ocr")
                    finally:
                        signal.alarm(0)

                elif has_text:
                    logger.info(f"[{self.job_id}] ➤ Texte déjà présent → compression seule")
                    logger.info(f"[{self.job_id}] 📄 Compression seule effectuée : {output_path.name}")

                # Traitement final (OCR ou compression seule)
                try:
                    ocrmypdf.ocr(str(input_path), str(output_path), **ocr_args)
                    logger.info(f"[{self.job_id}] ✅ Traitement final terminé : {output_path.name}")
                    output_files.append(out_name)
                except Exception as e:
                    logger.warning(f"[{self.job_id}] ⚠️ Échec traitement final : {e}")

            self._write_status("done", "Traitement OCR terminé", output_files)

        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Erreur globale OCR")
            self._write_status("error", str(e))
            raise
