import json
import os
import sys

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import config
from app.api import status

def test_status_ok(tmp_path, monkeypatch):
    job_id = "job1"
    job_dir = tmp_path / job_id
    job_dir.mkdir(parents=True)
    status_data = {"status": "done", "files": []}
    with (job_dir / config.STATUS_FILENAME).open("w", encoding="utf-8") as f:
        json.dump(status_data, f)
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)

    result = status.get_status(job_id)
    assert result.status == "done"


def test_status_not_found(tmp_path, monkeypatch):
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)
    with pytest.raises(Exception):
        status.get_status("unknown")
