from enum import Enum

class JobStatus(str, Enum):
    """Statuts possibles d’un job OCR."""
    queued           = "queued"
    processing       = "processing"
    done             = "done"
    done_with_errors = "done_with_errors"
    error            = "error"
