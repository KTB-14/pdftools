from enum import Enum
from pydantic import BaseModel
from typing import Optional, List

# Les différents états possibles d’un job
class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    error = "error"
    unknown = "unknown"

# Schéma pour une requête de création (optionnel selon tes endpoints)
class JobCreate(BaseModel):
    filenames: List[str]

# Schéma de réponse simplifiée
class JobOut(BaseModel):
    job_id: str
    status: JobStatus

# Schéma complet du statut, utilisé pour le endpoint /status/{job_id}
class FileEntry(BaseModel):
    id: str
    original: str
    output: str

class StatusOut(BaseModel):
    job_id: str
    status: JobStatus
    details: Optional[str] = None
    files: Optional[List[FileEntry]] = None
