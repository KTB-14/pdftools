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
            "files": files or []
        }
        try:
            with open(self.status_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
            logger.info(f"[{self.job_id}] 📝 Status mis à jour : {status}")
        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Erreur lors de l'écriture du fichier status.json : {e}")

    def _is_tagged(self, pdf_path: Path) -> bool:
        try:
            with pikepdf.open(str(pdf_path)) as pdf:
                return "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
        except Exception as e:
            logger.warning(f"[{self.job_id}] ⚠️ Impossible de vérifier le tagging : {e}")
            return False

    def _has_text(self, pdf_path: Path) -> bool:
        try:
            with pikepdf.open(str(pdf_path)) as pdf:
                for page in pdf.pages:
                    if "/Contents" in page.obj:
                        return True
        except Exception as e:
            logger.warning(f"[{self.job_id}] ⚠️ Impossible de détecter du texte : {e}")
        return False

    def process(self) -> None:
        self._write_status("processing", "OCR en cours")
        logger.info(f"[{self.job_id}] 🚀 Début du traitement OCR")
        output_files = []

        try:
            files = list(os.listdir(self.input_dir))
            if not files:
                raise FileNotFoundError("Aucun fichier PDF trouvé dans le dossier d'entrée")
        except Exception as e:
            logger.exception(f"[{self.job_id}] ❌ Impossible de lire le dossier d'entrée")
            self._write_status("error", str(e))
            return

        for filename in files:
            input_path = self.input_dir / filename
            stem = Path(filename).stem
            ext = Path(filename).suffix
            output_path = self.output_dir / f"{stem}_compressed{ext}"

            logger.info(f"[{self.job_id}] 🧾 Traitement du fichier : {filename}")

            is_tagged = self._is_tagged(input_path)
            has_text = self._has_text(input_path)
            logger.info(f"[{self.job_id}] 📌 Taggé : {is_tagged} | Texte détecté : {has_text}")

            try:
                if not is_tagged and not has_text:
                    logger.info(f"[{self.job_id}] 🧠 OCR complet requis (non taggé, sans texte)")
                    ocrmypdf.ocr(
                        str(input_path),
                        str(output_path),
                        deskew=True,
                        skip_text=True,
                        optimize=3,
                        use_threads=True
                    )
                else:
                    logger.info(f"[{self.job_id}] 📄 Compression seule (pas d'OCR nécessaire)")
                    ocrmypdf.ocr(
                        str(input_path),
                        str(output_path),
                        force_ocr=False,
                        optimize=3,
                        use_threads=True
                    )

                if output_path.exists():
                    output_files.append(output_path.name)
                    logger.info(f"[{self.job_id}] ✅ Fichier généré : {output_path.name}")
                else:
                    raise FileNotFoundError("Aucun fichier de sortie généré")

            except Exception as e:
                error_msg = str(e)
                logger.warning(f"[{self.job_id}] ⚠️ Erreur traitement : {error_msg}")

                if "Tagged PDF" in error_msg or "does not need OCR" in error_msg:
                    logger.warning(f"[{self.job_id}] ⚠️ PDF probablement déjà OCRisé → tentative fallback compression")

                    try:
                        logger.warning(f"[{self.job_id}] ⚠️ Fallback 1 avec --skip-text + --force-ocr")
                        ocrmypdf.ocr(
                            str(input_path),
                            str(output_path),
                            skip_text=True,
                            force_ocr=True,
                            optimize=3,
                            use_threads=True
                        )
                        if output_path.exists():
                            output_files.append(output_path.name)
                            logger.info(f"[{self.job_id}] ✅ Fallback 1 réussi : {output_path.name}")
                            continue
                    except Exception as fallback_error1:
                        logger.warning(f"[{self.job_id}] ⚠️ Fallback 1 échoué : {fallback_error1}")

                    try:
                        logger.warning(f"[{self.job_id}] ⚠️ Fallback 2 avec --force-ocr=False (compression seule forcée)")
                        ocrmypdf.ocr(
                            str(input_path),
                            str(output_path),
                            force_ocr=False,
                            optimize=3,
                            use_threads=True
                        )
                        if output_path.exists():
                            output_files.append(output_path.name)
                            logger.info(f"[{self.job_id}] ✅ Fallback 2 réussi : {output_path.name}")
                            continue
                        else:
                            raise FileNotFoundError("Fallback 2 : aucun fichier généré")
                    except Exception as fallback_error2:
                        logger.error(f"[{self.job_id}] ❌ Fallback 2 échoué : {fallback_error2}")

                else:
                    logger.error(f"[{self.job_id}] ❌ Erreur non rattrapable : {error_msg}")

        if output_files:
            self._write_status("done", "Traitement terminé avec succès", output_files)
        else:
            self._write_status("error", "Aucun fichier n'a pu être traité")
