# backend/tests/test_status_schema.py
from app.models.job import FileEntry
def test_file_entry_schema():
    sample = {
        "id": "abc",
        "original": "x.pdf",
        "output": "x_c.pdf",
        "size_before": 1000,
        "size_after":  500,
        "ratio": 50.0,
    }
    FileEntry(**sample)  # ne doit pas lever
