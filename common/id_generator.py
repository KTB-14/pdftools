import uuid
from datetime import datetime

def generate_job_id() -> str:
    """
    Génère un identifiant unique pour chaque job :
    - 12 premiers caractères d’un UUID4
    - suffixe horodaté YYYYMMDD-HHMMSS
    """
    uid       = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{uid}_{timestamp}"
