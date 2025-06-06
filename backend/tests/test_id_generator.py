import re
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.utils.id_generator import generate_job_id

def test_generate_job_id_pattern():
    job_id = generate_job_id()
    assert re.match(r"^[0-9a-f]{12}_\d{8}-\d{6}$", job_id)
