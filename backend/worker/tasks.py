"""Définition des tâches Celery consommées par le worker."""

from celery import Celery, states
from celery.exceptions import Ignore
from app.services.ocr.ocr_service import OCRService
from app.config import config
from app.logger import logger

# =============================== CELERY TASKS ================================
# Déclare la tâche asynchrone ``ocr_task`` exécutée par le worker Celery.

# Instance Celery connectée à Redis
celery_app = Celery(
    "ocr_tasks",
    broker=config.CELERY_BROKER_URL,
    backend=config.CELERY_RESULT_BACKEND,
)

@celery_app.task(bind=True, name="ocr_task", acks_late=True)
def ocr_task(self, job_id: str):
    """Tâche asynchrone exécutant OCRService sur un dossier de job."""
    logger.info(f"[{job_id}] Tâche OCR lancée")

    try:
        self.update_state(state="PROCESSING", meta="Démarrage du traitement OCR")
        logger.info(f"[{job_id}] Traitement OCR en cours...")

        ocr = OCRService(job_id)
        ocr.process()

        logger.info(f"[{job_id}] OCR terminé avec succès")
        return {"status": "done"}  

    except Exception as exc:
        logger.exception(f"[{job_id}] Erreur lors du traitement OCR : {exc}")
        self.update_state(state=states.FAILURE, meta=str(exc))
        raise Ignore()

    finally:
        logger.info(f"[{job_id}] Fin de tâche OCR (avec ou sans succès)")
 
