from celery import Celery, states
from celery.exceptions import Ignore
from app.services.ocr.ocr_service import OCRService
from app.services.ocr.zip_service import ZipService
from app.config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND

# Initialisation de l'application Celery
celery_app = Celery(
    "ocr_tasks",
    broker=CELERY_BROKER_URL,           # Redis utilisé comme broker (file d’attente)
    backend=CELERY_RESULT_BACKEND       # Redis pour stocker les résultats
)

@celery_app.task(bind=True, name="ocr_task", acks_late=True)
def ocr_task(self, job_id: str):
    """
    Tâche asynchrone principale appelée lors d’un upload :
    - Lance le traitement OCR du job
    - Crée une archive ZIP des fichiers générés

    En cas d’erreur, l'état Celery est mis en échec (FAILURE).
    """
    try:
        self.update_state(state="PROCESSING", meta="Démarrage du traitement OCR")
        ocr = OCRService(job_id)
        ocr.process()
        archive = ZipService.make_archive(job_id)
        return {"archive_path": archive}

    except Exception as exc:
        # Enregistre l’erreur dans l’état Celery et interrompt proprement
        self.update_state(state=states.FAILURE, meta=str(exc))
        raise Ignore()
