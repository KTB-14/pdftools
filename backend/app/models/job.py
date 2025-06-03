from enum import Enum
from typing import List, Optional
from pydantic import BaseModel

# ───────── États d'un job
class JobStatus(str, Enum):
    pending = "pending"
    processing = "processing"
    done = "done"
    error = "error"
    unknown = "unknown"

# ───────── Réponse à la création
class JobOut(BaseModel):
    job_id: str
    status: JobStatus

# ───────── Détail d'un fichier
class FileEntry(BaseModel):
    id: str
    original: str
    output: str
    size_before: Optional[int] = None   # octets
    size_after:  Optional[int] = None   # octets
    ratio: Optional[float] = None       # % (<=100)

# ───────── Réponse /status/{job_id}
class StatusOut(BaseModel):
    job_id: str
    status: JobStatus
    details: Optional[str] = None
    files: Optional[List[FileEntry]] = None
