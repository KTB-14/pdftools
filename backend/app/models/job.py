from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

# =============================== MODELES Pydantic ============================
# Structures de données échangées avec l'API. Elles facilitent la validation
# et la documentation automatique des endpoints.

# ───────── États d'un job
class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    error = "error"
    unknown = "unknown"

# ───────── Réponse à la création
class JobOut(BaseModel):
    """Réponse retournée après la création d'un job."""
    job_id: str
    status: JobStatus

# ───────── Détail d'un fichier
class FileEntry(BaseModel):
    """Informations sur chaque fichier traité."""
    id: str
    original: str
    output: str | None
    final_name: str | None
    size_before: Optional[int] = None
    size_after:  Optional[int] = None
    ratio: Optional[float] = None
    error: Optional[str] = None          

# ───────── Réponse /status/{job_id}
class StatusOut(BaseModel):
    """Structure renvoyée par ``GET /status/{job_id}``."""
    job_id: str
    status: JobStatus
    details: Optional[str] = None
    files: Optional[List[FileEntry]] = None

