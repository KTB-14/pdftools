from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from .api import upload, status, download
from .config import OCR_ROOT, BASE_DIR
import os

app = FastAPI(title="OCR Service")

# Crée le dossier racine des jobs si besoin
os.makedirs(OCR_ROOT, exist_ok=True)

# Monter le dossier frontend (pour accéder au formulaire HTML)
# app.mount("/frontend", StaticFiles(directory="frontend"), name="frontend")

#from .config import BASE_DIR
#app.mount("/frontend", StaticFiles(directory=BASE_DIR.parent / "ocr_frontend"), name="frontend")

# Enregistrement des routes API
app.include_router(upload.router, prefix="", tags=["upload"])
app.include_router(status.router, prefix="", tags=["status"])
app.include_router(download.router, prefix="", tags=["download"])

# Autoriser CORS côté FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ou ["http://192.168.1.127"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'OCR Service"}
