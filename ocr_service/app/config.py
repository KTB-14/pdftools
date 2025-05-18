import os
from pathlib import Path

# 1) Racine du projet Stage/
BASE_DIR = Path(__file__).resolve().parents[2]

# 2) Dossiers centraux
OCR_ROOT     = BASE_DIR / "ocr_files"
FRONTEND_DIR = BASE_DIR / "ocr_frontend"
LOG_DIR      = BASE_DIR / "logs"

# 3) Sous-dossiers par job
INPUT_SUBDIR  = "input_ocr"
OUTPUT_SUBDIR = "output_ocr"
ZIP_SUBDIR    = "archives"
STATUS_FILENAME = "status.json"

# 4) Celery / Redis
CELERY_BROKER_URL     = os.getenv("CELERY_BROKER_URL",     "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# 5) Durée de vie d’un job (en secondes)
JOB_TTL_SECONDS = 1800  # 30 minutes pour test, ou 7*24*3600 pour 7 jours

# 6) Création automatique des dossiers racine
OCR_ROOT.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
