from pydantic import BaseModel
from common.enums import JobStatus
from typing import Optional

class JobOut(BaseModel):
    """Réponse à l’upload POST /upload"""
    job_id: str

class StatusOut(BaseModel):
    """Réponse GET /status/{job_id}"""
    job_id:  str
    status:  JobStatus
    details: Optional[str] = None
