import os
from pathlib import Path
from dotenv import load_dotenv

# Charge .env si présent
load_dotenv()

# Racine du projet (Stage/)
BASE_DIR = Path(__file__).resolve().parent.parent

# Directoires centraux
OCR_ROOT     = BASE_DIR / "ocr_files"       # stocke input_ocr/ output_ocr/ archives/
FRONTEND_DIR = BASE_DIR / "ocr_frontend"    # front statique
LOG_DIR      = BASE_DIR / "logs"            # logs rotatifs

# Sous-dossiers d’un job
INPUT_SUBDIR     = "input_ocr"
OUTPUT_SUBDIR    = "output_ocr"
ZIP_SUBDIR       = "archives"
STATUS_FILENAME  = "status.json"

# Celery / Redis
CELERY_BROKER_URL     = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# TTL d’un job (en secondes)
JOB_TTL_SECONDS = int(os.getenv("JOB_TTL_SECONDS", 7*24*3600))

# Création des dossiers racines
OCR_ROOT.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
