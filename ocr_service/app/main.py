from fastapi import FastAPI
from .api import upload, status, download
from .config import OCR_ROOT
import uvicorn
import os

app = FastAPI(title="OCR Service")

# Crée le dossier racine si nécessaire
os.makedirs(OCR_ROOT, exist_ok=True)

# Enregistrement des routes
app.include_router(upload.router, prefix="", tags=["upload"])
app.include_router(status.router, prefix="", tags=["status"])
app.include_router(download.router, prefix="", tags=["download"])

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'OCR Service"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
