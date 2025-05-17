from enum import Enum
from pydantic import BaseModel
from typing import List

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
    details: str = None  # optionnel : message d’erreur ou progression
