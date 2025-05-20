import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from app.config import LOG_DIR

# Création du dossier de log si inexistant
Path(LOG_DIR).mkdir(parents=True, exist_ok=True)

# Initialisation du logger global pour l’application
logger = logging.getLogger("pdf_service_logger")
logger.setLevel(logging.INFO)

# Configuration du fichier de log rotatif (50 Mo max, 5 sauvegardes)
log_path = LOG_DIR / "ocr.log"
handler = RotatingFileHandler(
    filename=log_path,
    maxBytes=50 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)

# Format des logs
formatter = logging.Formatter("[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
