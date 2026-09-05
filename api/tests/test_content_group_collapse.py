import json
from app.db.session import SessionLocal
from app.services.publish_service import PublishService
from app.storage import get_storage

def test_content_group_collapsing():
    db = SessionLocal()
    storage = get_storage()
    final_key = "catalog/catalogue.json"

    result = PublishService.execute_publish(db, triggered_by="admin@peblo.tv")
    assert result.status == "success"

    raw = storage.get(final_key)
    catalog = json.loads(raw.decode("utf-8"))

    # Find Moti's Many Lives (which has content_group variants for en and hi)
    moti_show = next((s for s in catalog["all_shows"] if s["title"] == "Moti's Many Lives"), None)
    assert moti_show is not None

    # Check normal seasons
    assert len(moti_show["seasons"]) > 0
    season_1 = next((s for s in moti_show["seasons"] if s["season_number"] == 1), None)
    assert season_1 is not None

    # Find the episode with content_group "motis-many-lives-s01e01"
    ep_s01e01 = next((e for e in season_1["episodes"] if e.get("content_group") == "motis-many-lives-s01e01"), None)
    assert ep_s01e01 is not None
    # Must have collapsed into ONE entry with both "en" and "hi"
    assert "en" in ep_s01e01["languages"]
    assert "hi" in ep_s01e01["languages"]
    assert len(ep_s01e01["languages"]) >= 2

    # Verify Season 0 trailers are separated out and NOT in normal seasons
    assert not any(s["season_number"] == 0 for s in moti_show["seasons"])
    assert len(moti_show["trailers"]) > 0
    assert any("Trailer" in t["title"] or t.get("duration_seconds") for t in moti_show["trailers"])
    db.close()
