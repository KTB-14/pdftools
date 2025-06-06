from app.logger import logger
import uuid
from datetime import datetime

# =============================== ID GENERATOR ================================
# Génère un identifiant unique pour chaque job sous la forme
# ``<hex>_<timestamp>`` afin de faciliter la traçabilité.

def generate_job_id() -> str:
    """Retourne un identifiant unique combinant UUID et date."""
    uid = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    job_id = f"{uid}_{timestamp}"
    logger.info(f"🆕 Job ID généré : {job_id}")
    return job_id
 
