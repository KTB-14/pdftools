from celery import Celery, states
from celery.exceptions import Ignore
from app.services.ocr.ocr_service import OCRService
from app.services.ocr.zip_service import ZipService
from app.config import config
from app.logger import logger  # Chemin selon où est ton fichier de logger

# Initialisation de l'application Celery
celery_app = Celery(
    "ocr_tasks",
    broker=config.CELERY_BROKER_URL,          # Redis utilisé comme broker (file d’attente)
    backend=config.CELERY_RESULT_BACKEND       # Redis pour stocker les résultats
)

@celery_app.task(bind=True, name="ocr_task", acks_late=True)
def ocr_task(self, job_id: str):
    logger.info(f"[{job_id}] ➤ Tâche OCR lancée")

    try:
        self.update_state(state="PROCESSING", meta="Démarrage du traitement OCR")
        logger.info(f"[{job_id}] ➤ Traitement OCR en cours...")

        ocr = OCRService(job_id)
        ocr.process()

        logger.info(f"[{job_id}] ✅ OCR terminé avec succès")

        archive = ZipService.make_archive(job_id)
        logger.info(f"[{job_id}] 📦 Archive créée : {archive}")

        return {"archive_path": archive}

    except Exception as exc:
        logger.exception(f"[{job_id}] ❌ Erreur lors du traitement OCR : {exc}")
        self.update_state(state=states.FAILURE, meta=str(exc))
        raise Ignore()

    finally:
        logger.info(f"[{job_id}] 🔚 Fin de tâche OCR (avec ou sans succès)")

    
