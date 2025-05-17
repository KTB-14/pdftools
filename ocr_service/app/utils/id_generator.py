import uuid

def generate_job_id() -> str:
    """Génère un UUID4 pour chaque job."""
    return uuid.uuid4().hex
