"""Point d'entrée de l'API FastAPI."""

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, status, download
from app.config import config
from app.logger import logger
import os

# =============================== INIT APP ====================================
# Ce fichier crée l'application FastAPI et enregistre les routes. Il est
# exécuté par Uvicorn via l'unité systemd ``ocr-api.service``.

# Initialisation de l'application FastAPI
# ``app`` est utilisé par Uvicorn pour servir l'API.
app = FastAPI(title="PDFTools – OCR & Compression")
logger.info("Démarrage de l'application FastAPI PDFTools")

# Création automatique du dossier des jobs si inexistant.
# ``OCR_ROOT`` est défini dans ``app/config.py`` et peut être sur un autre disque.
os.makedirs(config.OCR_ROOT, exist_ok=True)
logger.info(f"Dossier OCR_ROOT vérifié/créé à : {config.OCR_ROOT}")

# Montage optionnel du frontend statique (HTML/CSS/JS).
# Commenté par défaut car l'application peut être servie via Apache.
# Décommenter pour servir directement les fichiers ``frontend/`` par FastAPI.
# try:
#     app.mount("/frontend", StaticFiles(directory=config.FRONTEND_DIR), name="frontend")
#     logger.info(f"Frontend monté depuis {config.FRONTEND_DIR}")
# except Exception as e:
#     logger.warning(f" Impossible de monter le frontend depuis {config.FRONTEND_DIR} : {e}")

# Inclusion des routes API définies dans ``backend/app/api``.
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(status.router, prefix="/api", tags=["Status"])
app.include_router(download.router, prefix="/api", tags=["Download"])
logger.info("Routes API enregistrées : /api/upload, /api/status, /api/download")

# Middleware CORS : autorise ou restreint les appels externes à l'API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"CORS activé pour : {config.ALLOWED_ORIGINS}")

# Route racine
@app.get("/")
def read_root():
    """Point d'entrée minimal utilisé pour tester que l'API répond."""
    return {"message": "Bienvenue sur PDFTools  API OCR"}
