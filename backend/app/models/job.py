from enum import Enum
from pydantic import BaseModel
from typing import List, Optional

class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    done_with_errors = "done_with_errors"
    error = "error"

class JobCreate(BaseModel):
    """
    Schéma pour la création d’un job (non utilisé côté API pour l’instant,
    mais potentiellement utile pour une future évolution).
    """
    filenames: List[str]

class JobOut(BaseModel):
    """
    Réponse renvoyée à la fin d’un upload.
    Contient uniquement l’ID du job (UUID_timestamp).
    """
    job_id: str

class StatusOut(BaseModel):
    """
    Réponse structurée de l’endpoint `/status/{job_id}` :
    - job_id : identifiant unique
    - status : état actuel du job (Enum)
    - details : message technique ou progression
    """
    job_id: str
    status: JobStatus
    details: Optional[str] = None
