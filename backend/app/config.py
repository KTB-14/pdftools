import os
from pathlib import Path
from dotenv import load_dotenv

# Chargement des variables définies dans le fichier .env
load_dotenv()

# Répertoire racine du projet (pdftools/)
BASE_DIR = Path(__file__).resolve().parents[2]

# === CHEMINS D’ACCES CENTRALISÉS ===

JOBS_DIR     = BASE_DIR / "data" / "jobs"          # Dossier de stockage des fichiers PDF
FRONTEND_DIR = BASE_DIR / "frontend"               # Répertoire contenant index.html
LOG_DIR      = BASE_DIR / "backend" / "logs"       # Répertoire des logs (backoffice)

# === SOUS-DOSSIERS DES JOBS ===
INPUT_SUBDIR   = "input_ocr"
OUTPUT_SUBDIR  = "output_ocr"
ZIP_SUBDIR     = "archives"
STATUS_FILENAME = "status.json"

# === CELERY / REDIS ===
CELERY_BROKER_URL      = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND  = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# === GESTION DU TEMPS DE VIE DES JOBS ===
JOB_TTL_SECONDS = int(os.getenv("JOB_TTL_SECONDS", 1800))  # par défaut : 30 minutes

# Création automatique des dossiers critiques
JOBS_DIR.mkdir(parents=True, exist_ok=True)
LOG_DIR.mkdir(parents=True, exist_ok=True)
