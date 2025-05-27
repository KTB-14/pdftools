from celery import Celery
from app.services.ocr.ocr_service import OCRService
from app.logger import logger
from app.utils.job import create_job_dirs
from app.utils.id_generator import generate_job_id
from app.config import config

celery_app = Celery("worker", broker=config.CELERY_BROKER_URL, backend=config.CELERY_RESULT_BACKEND)

@celery_app.task(name="process_ocr")
def process_ocr(job_id: str):
    logger.info(f"[{job_id}] ➤ Tâche OCR lancée")
    try:
        # Dossiers déjà créés à l'upload
        service = OCRService(job_id)
        service.process()
        logger.info(f"[{job_id}] ✅ OCR terminé avec succès")
    except Exception as e:
        logger.exception(f"[{job_id}] ❌ Erreur lors du traitement OCR")
    finally:
        logger.info(f"[{job_id}] 🔚 Fin de tâche OCR (avec ou sans succès)")
