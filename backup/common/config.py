import os
from pathlib import Path
from dotenv import load_dotenv

# Charge les variables d’environnement définies dans le fichier .env à la racine du projet
BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# === RÉPERTOIRES DU PROJET ===
OCR_ROOT     = BASE_DIR / "ocr_files"
FRONTEND_DIR = BASE_DIR / "ocr_frontend"
LOG_DIR      = BASE_DIR / "logs"

# === SOUS-RÉPERTOIRES PAR JOB ===
INPUT_SUBDIR  = "input_ocr"
OUTPUT_SUBDIR = "output_ocr"
ZIP_SUBDIR    = "archives"
STATUS_FILENAME = "status.json"

# === CONFIGURATION REDIS / CELERY ===
CELERY_BROKER_URL     = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# === DURÉE DE VIE DES JOBS (ex. purge automatique via cron) ===
JOB_TTL_SECONDS = 1800  # 30 min (modifiable)

# === CRÉATION DES DOSSIERS SI ABSENTS ===
OCR_ROOT.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
