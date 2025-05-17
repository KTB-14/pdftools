import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent

# Dossiers de travail
OCR_ROOT = BASE_DIR / "ocr_files"
INPUT_SUBDIR = "input_ocr"
OUTPUT_SUBDIR = "output_ocr"
ZIP_SUBDIR = "archives"

# Celery broker & backend (Redis)
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# Durées, tailles, etc.
JOB_TTL_SECONDS = 7 * 24 * 3600  # supprimer jobs après 7 jours
