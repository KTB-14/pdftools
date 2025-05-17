from celery import Celery, states
from celery.exceptions import Ignore
from app.services.ocr_service import OCRService
from app.services.zip_service import ZipService
from app.config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND

celery_app = Celery(
    "ocr_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)

@celery_app.task(bind=True, name="ocr_task", acks_late=True)
def ocr_task(self, job_id: str):
    """
    Tâche principale : OCR + compression + archivage.
    Utilise le job_id fourni comme identifiant Celery.
    """
    try:
        self.update_state(state="PROCESSING", meta="Démarrage du traitement OCR")
        ocr = OCRService(job_id)
        ocr.process()
        archive = ZipService.make_archive(job_id)
        return {"archive_path": archive}
    except Exception as exc:
        # Marque le job en erreur et interrompt
        self.update_state(state=states.FAILURE, meta=str(exc))
        raise Ignore()
