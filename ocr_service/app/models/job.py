from enum import Enum
from pydantic import BaseModel
from typing import List, Optional  # 👈 ajoute Optional ici

class JobStatus(str, Enum):
    queued = "queued"
    processing = "processing"
    done = "done"
    done_with_errors = "done_with_errors"
    error = "error"

class JobCreate(BaseModel):
    filenames: List[str]

class JobOut(BaseModel):
    job_id: str

class StatusOut(BaseModel):
    job_id: str
    status: JobStatus
    details: Optional[str] = None  # 👈 change ici (Optional[str])
