# backend/app/services/ocr/ocr_service.py
import os
import json
from pathlib import Path

import ocrmypdf
import pikepdf
from pikepdf import PdfError, PasswordError

from app.config import config
from app.logger import logger

MAX_FILE_SIZE_MB = 50  # limite soft — à adapter

class OCRService:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.job_dir = config.OCR_ROOT / job_id
        self.input_dir = self.job_dir / config.INPUT_SUBDIR
        self.output_dir = self.job_dir / config.OUTPUT_SUBDIR
        self.status_file = self.job_dir / config.STATUS_FILENAME

        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"[{self.job_id}] 📁 Dossier de sortie vérifié : {self.output_dir}")

        # Récupère le mapping {nom_original: id} depuis file_ids.json
        self.file_ids: dict[str, str] = {}
        ids_path = self.job_dir / "file_ids.json"
        if ids_path.exists():
            with ids_path.open("r", encoding="utf-8") as f:
                self.file_ids = json.load(f)

    # ------------------------------------------------------------------ #
    # Helpers
    # ------------------------------------------------------------------ #
    def _write_status(self, status: str, details: str | None, files: list | None):
        data = {
            "job_id": self.job_id,
            "status": status,
            "details": details,
            "files": files,
        }
        try:
            with self.status_file.open("w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            logger.info(f"[{self.job_id}] 📝 Status mis à jour : {status}")
        except Exception as e:  # pragma: no cover
            logger.exception(f"[{self.job_id}] ❌ Impossible d’écrire status.json : {e}")

    # ------------------------------------------------------------------ #
    # Pipeline principal
    # ------------------------------------------------------------------ #
    def process(self) -> None:
        self._write_status("processing", "OCR en cours", None)
        logger.info(f"[{self.job_id}] 🚀 Démarrage du traitement OCR")

        input_files = list(self.input_dir.iterdir())
        if not input_files:
            raise FileNotFoundError("Aucun PDF dans le dossier d’entrée")

        results: list[dict] = []
        processed_ok = 0

        for in_file in input_files:
            filename = in_file.name
            logger.info(f"[{self.job_id}] 🔄 Traitement : {filename}")

            # Structure par défaut de la ligne résultat
            result_entry = {
                "id": self.file_ids.get(filename, ""),
                "original": filename,
                "output": None,
                "final_name": None,
                "size_before": None,
                "size_after": None,
                "ratio": None,
                "status": "error",   # sera mis à processed en cas de succès
                "reason": None,
            }

            try:
                # ------- vérifications pré-traitement --------------------
                size_before = in_file.stat().st_size
                if size_before / (1024 * 1024) > MAX_FILE_SIZE_MB:
                    raise ValueError(f"Fichier > {MAX_FILE_SIZE_MB} Mo")

                # Ouvre le PDF pour tester (et détecter tag / mot de passe)
                with pikepdf.open(in_file) as pdf:
                    if pdf.is_encrypted:
                        raise ValueError("Fichier protégé par mot de passe")
                    is_tagged = (
                        "/MarkInfo" in pdf.Root and pdf.Root["/MarkInfo"].get("/Marked", False)
                    )

                # ------- construction des chemins sortie -----------------
                stem = in_file.stem
                out_name = f"{stem}_compressed.pdf"
                out_path = self.output_dir / out_name

                # ------- choix des options OCR ---------------------------
                if is_tagged:
                    logger.info(f"[{self.job_id}] 📌 PDF taggé → compression seule")
                    ocr_opts = dict(
                        optimize=3,
                        redo_ocr=False,
                        force_ocr=False,
                        skip_text=True,
                        output_type="pdf",
                    )
                else:
                    ocr_opts = dict(optimize=3, deskew=True, skip_text=True)

                # ------- exécution ocrmypdf ------------------------------
                ocrmypdf.ocr(
                    in_file,
                    out_path,
                    skip_digital_signatures=True,
                    **ocr_opts,
                )

                # ------- stats et succès ---------------------------------
                output_size = out_path.stat().st_size
                ratio = round(output_size / size_before * 100, 1)

                result_entry.update(
                    {
                        "output": out_name,
                        "final_name": out_name,
                        "size_before": size_before,
                        "size_after": output_size,
                        "ratio": ratio,
                        "status": "processed",
                    }
                )
                processed_ok += 1
                logger.info(f"[{self.job_id}] ✅ Terminé : {out_name} (ratio {ratio} %)")

            # ------------ Gestion des erreurs spécifiques ---------------
            except PasswordError:
                result_entry["reason"] = "Mot de passe requis"
                logger.warning(f"[{self.job_id}] 🔒 {filename} protégé par mot de passe")

            except PdfError:
                result_entry["reason"] = "Fichier PDF invalide"
                logger.warning(f"[{self.job_id}] ❌ {filename} n’est pas un PDF valide")

            except ValueError as ve:
                result_entry["reason"] = str(ve)
                logger.warning(f"[{self.job_id}] ⚠️ {filename} ignoré : {ve}")

            # ------------ Erreur inconnue -------------------------------
            except Exception as e:
                result_entry["reason"] = "Erreur inconnue"
                logger.exception(f"[{self.job_id}] ❌ Erreur sur {filename} : {e}")

            # Toujours ajouter l’entrée résultat
            results.append(result_entry)

        # -------------------------------------------------------------- #
        # Fin de boucle – écriture status.json
        # -------------------------------------------------------------- #
        if processed_ok:
            self._write_status("done", "Traitement terminé", results)
        else:
            # Aucun fichier n’a abouti → état global error
            self._write_status("error", "Aucun fichier traité avec succès", results)
            raise RuntimeError("Tous les fichiers ont échoué")

