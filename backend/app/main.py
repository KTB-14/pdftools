from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from app.api import upload, status, download
from app.config import FRONTEND_DIR, JOBS_DIR

import os

# Initialisation de l'application FastAPI
app = FastAPI(title="PDFTools – OCR & Compression")

# Création automatique du dossier des jobs si inexistant
os.makedirs(JOBS_DIR, exist_ok=True)

# Montage du frontend statique (formulaire HTML)
app.mount("/frontend", StaticFiles(directory=FRONTEND_DIR), name="frontend")

# Inclusion des routes API
app.include_router(upload.router, prefix="", tags=["Upload"])
app.include_router(status.router, prefix="", tags=["Status"])
app.include_router(download.router, prefix="", tags=["Download"])

# Middleware CORS (autorise les appels externes à l’API)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # À restreindre au domaine de l’entreprise si nécessaire
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route racine (simple message de bienvenue)
@app.get("/")
def read_root():
    return {"message": "Bienvenue sur PDFTools – API OCR"}
