from celery import Celery
from common.config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND

celery_app = Celery(
    "stage_ocr",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)
