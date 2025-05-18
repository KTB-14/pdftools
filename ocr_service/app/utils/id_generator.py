import uuid
from datetime import datetime

def generate_job_id():
    uid = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return f"{uid}_{timestamp}"
