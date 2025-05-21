from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api import upload, status, download
from app.config import config   
from app.logger import logger
import os

# Initialisation de l'application FastAPI
app = FastAPI(title="PDFTools – OCR & Compression")
logger.info("🚀 Démarrage de l'application FastAPI PDFTools")

# Création automatique du dossier des jobs si inexistant
os.makedirs(config.OCR_ROOT, exist_ok=True)
logger.info(f"Dossier OCR_ROOT vérifié/créé à : {config.OCR_ROOT}")

# Montage du frontend statique (formulaire HTML)
# try:
#     app.mount("/frontend", StaticFiles(directory=config.FRONTEND_DIR), name="frontend")
#     logger.info(f"Frontend monté depuis {config.FRONTEND_DIR}")
# except Exception as e:
#     logger.warning(f" Impossible de monter le frontend depuis {config.FRONTEND_DIR} : {e}")

# Inclusion des routes API
app.include_router(upload.router, prefix="/api", tags=["Upload"])
app.include_router(status.router, prefix="/api", tags=["Status"])
app.include_router(download.router, prefix="/api", tags=["Download"])
logger.info("✅ Routes API enregistrées : /api/upload, /api/status, /api/download")

# Middleware CORS (autorise les appels externes à l’API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger.info(f"🎯 CORS activé pour : {config.ALLOWED_ORIGINS}")

# Route racine
@app.get("/")
def read_root():
    return {"message": "Bienvenue sur PDFTools  API OCR"}
