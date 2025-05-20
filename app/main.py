from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.upload    import router as upload_router
from api.status    import router as status_router
from api.download  import router as download_router
from common.config import FRONTEND_DIR, OCR_ROOT
import os

app = FastAPI(title="Stage OCR Service")

# S’assure que le dossier OCR_ROOT existe
os.makedirs(OCR_ROOT, exist_ok=True)

# CORS (si front distant)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

# Enregistre routes
app.include_router(upload_router,   prefix="", tags=["upload"])
app.include_router(status_router,   prefix="", tags=["status"])
app.include_router(download_router, prefix="", tags=["download"])

@app.get("/")
def root():
    return {"message": "Bienvenue sur Stage OCR Service"}
