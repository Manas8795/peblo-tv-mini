import json
import pytest
from unittest.mock import patch
from app.db.session import SessionLocal
from app.db.models.publish_run import PublishRun
from app.services.publish_service import PublishService
from app.storage import get_storage

def test_atomic_publish_success():
    db = SessionLocal()
    storage = get_storage()
    final_key = "catalog/catalogue.json"

    result = PublishService.execute_publish(db, triggered_by="admin@peblo.tv")

    assert result.status == "success"
    assert storage.exists(final_key) is True

    # Validate published file content
    raw = storage.get(final_key)
    catalog = json.loads(raw.decode("utf-8"))
    assert "sections" in catalog
    assert "all_shows" in catalog
    assert catalog["total_shows"] > 0

    # Validate PublishRun record
    run = db.query(PublishRun).filter(PublishRun.id == result.run_id).first()
    assert run is not None
    assert run.status == "success"
    assert run.finished_at is not None
    db.close()

def test_atomic_publish_failure_preserves_previous_file():
    db = SessionLocal()
    storage = get_storage()
    final_key = "catalog/catalogue.json"

    # Step 1: Establish baseline catalogue
    PublishService.execute_publish(db, triggered_by="admin@peblo.tv")
    initial_content = storage.get(final_key)

    # Step 2: Simulate crash or error during atomic swap
    with patch.object(storage, "atomic_publish", side_effect=IOError("Disk write simulated failure")):
        with pytest.raises(IOError):
            PublishService.execute_publish(db, triggered_by="admin@peblo.tv")

    # Step 3: Verify the live file was NOT corrupted or lost
    assert storage.exists(final_key) is True
    assert storage.get(final_key) == initial_content

    # Step 4: Verify failed run recorded in DB
    failed_run = db.query(PublishRun).order_by(PublishRun.started_at.desc()).first()
    assert failed_run.status == "failed"
    assert "Publish failed: Disk write simulated failure" in failed_run.outcome_message
    db.close()
