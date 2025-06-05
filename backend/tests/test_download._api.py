import json
import sys
import os
from pathlib import Path
import types

import pytest
from fastapi import HTTPException

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Crée un module factice pydantic_settings si absent
if 'pydantic_settings' not in sys.modules:
    sys.modules['pydantic_settings'] = types.SimpleNamespace(BaseSettings=object)

from app.api import download
from app.config import config


def test_download_by_file_id_missing_output(tmp_path, monkeypatch):
    job_id = "job-test"
    job_dir = tmp_path / job_id
    output_dir = job_dir / config.OUTPUT_SUBDIR
    output_dir.mkdir(parents=True)
    status_path = job_dir / config.STATUS_FILENAME
    entry = {"id": "abc", "original": "f.pdf", "output": None, "final_name": None}
    with status_path.open("w", encoding="utf-8") as f:
        json.dump({"files": [entry]}, f)
    monkeypatch.setattr(config, "OCR_ROOT", tmp_path)

    with pytest.raises(HTTPException) as exc:
        download.download_by_file_id(job_id, "abc")
    assert exc.value.status_code == 404