import uuid
from datetime import datetime

def generate_job_id() -> str:
    """
    Génère un identifiant de job unique en combinant :
    - Un UUID aléatoire (12 premiers caractères)
    - Un timestamp au format YYYYMMDD-HHMMSS

    Exemple : 'a8b7d19c3fa1_20250520-231502'
    Utile pour nommer les répertoires de job sans collisions.
    """
    uid = uuid.uuid4().hex[:12]  # Génère une chaîne aléatoire unique (ex. : a8b7d19c3fa1)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")  # Ex : 20250520-231502
    return f"{uid}_{timestamp}"
