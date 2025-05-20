from app.logger import logger  # si tu veux logguer sa création

def generate_job_id() -> str:
    uid = uuid.uuid4().hex[:12]
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    job_id = f"{uid}_{timestamp}"
    logger.info(f"🆕 Job ID généré : {job_id}")
    return job_id
