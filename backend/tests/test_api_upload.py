import io
import json
import os
import sys
import types

import pytest
from fastapi import UploadFile
import asyncio

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.config import config
from app.api import upload


def test_upload_success(tmp_path, monkeypatch):
    monkeypatch.setattr(upload, "generate_job_id", lambda: "jid")

    captured = {}
    monkeypatch.setattr(upload, "ocr_task", types.SimpleNamespace(delay=lambda j: captured.setdefault("id", j)))

    up_file = UploadFile(filename="test.pdf", file=io.BytesIO(b"data"))
    result = asyncio.run(upload.upload_files(files=[up_file], file_ids=json.dumps({"test.pdf": "1"})))

    assert result.job_id == "jid"
    assert captured["id"] == "jid"
    assert (tmp_path / "jid" / config.INPUT_SUBDIR / "test.pdf").exists()


def test_upload_bad_ids(monkeypatch):
    up_file = UploadFile(filename="f.pdf", file=io.BytesIO(b"data"))
    with pytest.raises(Exception):
        asyncio.run(upload.upload_files(files=[up_file], file_ids="notjson"))
