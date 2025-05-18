import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from ..config import LOG_DIR

# assure que logs/ existe
Path(LOG_DIR).mkdir(parents=True, exist_ok=True)

# Initialise le logger
logger = logging.getLogger("ocr_service")
logger.setLevel(logging.INFO)

# Configure le RotatingFileHandler vers Stage/logs/ocr.log
logfile = Path(LOG_DIR) / "ocr.log"
handler = RotatingFileHandler(
    filename=str(logfile),
    maxBytes=30 * 1024 * 1024,
    backupCount=5,
    encoding="utf-8"
)

formatter = logging.Formatter("[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
handler.setFormatter(formatter)
logger.addHandler(handler)
