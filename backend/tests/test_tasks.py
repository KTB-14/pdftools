import sys
import os
import types

import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from worker import tasks


def test_ocr_task_success(monkeypatch):
    class DummyService:
        def __init__(self, job):
            self.job = job
        def process(self):
            self.processed = True

    monkeypatch.setattr(tasks, "OCRService", DummyService)
    result = tasks.ocr_task("j1")
    assert result == {"status": "done"}


def test_ocr_task_failure(monkeypatch):
    class DummyService:
        def __init__(self, job):
            pass
        def process(self):
            raise RuntimeError("fail")

    monkeypatch.setattr(tasks, "OCRService", DummyService)
    with pytest.raises(tasks.Ignore):
        tasks.ocr_task("j2")
