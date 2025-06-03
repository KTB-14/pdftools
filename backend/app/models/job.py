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
    final_name: str  # <--- AJOUT IMPORTANT
    size_before: Optional[int] = None  
    size_after:  Optional[int] = None  
    ratio: Optional[float] = None      

# ───────── Réponse /status/{job_id}
class StatusOut(BaseModel):
    job_id: str
    status: JobStatus
    details: Optional[str] = None
    files: Optional[List[FileEntry]] = None
