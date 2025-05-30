from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List
from pathlib import Path

class Config(BaseSettings):
    # === Dossiers principaux ===
    BASE_DIR: Path = Path(__file__).resolve().parents[2]
    OCR_ROOT: Path = BASE_DIR / "data" / "jobs"
    FRONTEND_DIR: Path = BASE_DIR / "frontend"
    LOG_DIR: Path = BASE_DIR / "backend" / "logs"

    # === Sous-dossiers des jobs ===
    INPUT_SUBDIR: str = "input_ocr"
    OUTPUT_SUBDIR: str = "output_ocr"
    STATUS_FILENAME: str = "status.json"  

    # === Celery / Redis ===
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/1"

    # === Config OCR ===
    JOB_TTL_SECONDS: int = 1800

    # === Logging ===
    LOG_LEVEL: str = "INFO"

    # === CORS ===
    ALLOWED_ORIGINS: List[str] = Field(default=["*"])

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

# Instance globale utilisable partout dans le projet
config = Config()

# Création automatique des dossiers critiques
config.OCR_ROOT.mkdir(parents=True, exist_ok=True)
config.LOG_DIR.mkdir(parents=True, exist_ok=True) 
