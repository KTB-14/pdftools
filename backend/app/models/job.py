from enum import Enum
from pydantic import BaseModel
from typing import List, Optional

class JobStatus(str, Enum):
    """
    Enumération des différents états possibles d’un job OCR.
    Permet de valider et structurer les statuts retournés au frontend.
    """
    queued = "queued"               # Tâche en file d'attente
    processing = "processing"       # Tâche en cours de traitement
    done = "done"                   # Traitement terminé avec succès
    done_with_errors = "done_with_errors"  # Terminé mais partiellement échoué
    error = "error"                 # Échec du traitement

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
