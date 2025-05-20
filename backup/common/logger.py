import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from .config import LOG_DIR

# Prépare le dossier de logs
Path(LOG_DIR).mkdir(parents=True, exist_ok=True)

logger = logging.getLogger("stage_ocr")
logger.setLevel(logging.INFO)

# Log rotatif : max 50 MB, 5 archives
handler = RotatingFileHandler(
    filename=str(Path(LOG_DIR)/"ocr.log"),
    maxBytes=50*1024*1024,
    backupCount=5,
    encoding="utf-8"
)
formatter = logging.Formatter(
    "[%(asctime)s] %(levelname)s in %(module)s:%(lineno)d: %(message)s"
)
handler.setFormatter(formatter)
logger.addHandler(handler)
