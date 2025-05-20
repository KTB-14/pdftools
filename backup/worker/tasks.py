from celery import states
from celery.exceptions import Ignore
from .celery_app import celery_app
from services.ocr.ocr_service import OCRService
from services.ocr.zip_service import ZipService

@celery_app.task(bind=True, name="ocr_task", acks_late=True)
def ocr_task(self, job_id: str):
    """
    Tâche asynchrone Celery :
      1. appel OCRService.process()
      2. appel ZipService.make_archive()
      3. retourne {'archive_path': ...}
    """
    try:
        self.update_state(state="PROCESSING", meta="Démarrage OCR")
        OCRService(job_id).process()
        archive = ZipService.make_archive(job_id)
        return {"archive_path": archive}
    except Exception as e:
        self.update_state(state=states.FAILURE, meta=str(e))
        raise Ignore()
