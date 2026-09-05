import os
import sys
import json
import uuid
import shutil
from pathlib import Path

# Add api directory to python path
current_dir = Path(__file__).resolve().parent
api_dir = current_dir.parent
sys.path.insert(0, str(api_dir))

from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.models.show import Show
from app.db.models.season import Season
from app.db.models.episode import Episode
from app.db.models.artwork import Artwork
from app.db.models.user import User
from app.config import settings

def load_seed_data():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # 1. Seed Users
    print("Seeding default users...")
    admin_user = db.query(User).filter(User.email == "admin@peblo.tv").first()
    if not admin_user:
        admin_user = User(
            id="usr_admin",
            email="admin@peblo.tv",
            name="Admin User",
            role="admin",
            api_key=settings.ADMIN_API_KEY
        )
        db.add(admin_user)

    editor_user = db.query(User).filter(User.email == "editor@peblo.tv").first()
    if not editor_user:
        editor_user = User(
            id="usr_editor",
            email="editor@peblo.tv",
            name="Content Editor",
            role="editor",
            api_key=settings.EDITOR_API_KEY
        )
        db.add(editor_user)

    db.commit()

    # 2. Check for seed_shows.json
    seed_paths = [
        api_dir.parent / "seed_shows.json",
        api_dir / "seed_shows.json",
        Path("seed_shows.json")
    ]
    seed_file = next((p for p in seed_paths if p.exists()), None)
    if not seed_file:
        print(f"Error: seed_shows.json not found in paths: {seed_paths}")
        return

    print(f"Loading seed shows from '{seed_file}'...")
    with open(seed_file, "r", encoding="utf-8") as f:
        seed_data = json.load(f)

    # 3. Setup sample assets in local storage
    storage_artwork_dir = Path(settings.LOCAL_STORAGE_PATH) / "artwork"
    storage_artwork_dir.mkdir(parents=True, exist_ok=True)

    assets_dir = api_dir.parent / "assets"
    poster_src = assets_dir / "poster_good.jpg"
    banner_src = assets_dir / "banner_good.jpg"
    thumb_src = assets_dir / "thumb_good.jpg"

    # Copy template sample assets
    sample_poster_key = "artwork/sample_poster.jpg"
    sample_banner_key = "artwork/sample_banner.jpg"
    sample_thumb_key = "artwork/sample_thumb.jpg"

    if poster_src.exists():
        shutil.copy(poster_src, storage_artwork_dir / "sample_poster.jpg")
    if banner_src.exists():
        shutil.copy(banner_src, storage_artwork_dir / "sample_banner.jpg")
    if thumb_src.exists():
        shutil.copy(thumb_src, storage_artwork_dir / "sample_thumb.jpg")

    # Clear existing show data to prevent duplicate seed loops
    db.query(Artwork).delete()
    db.query(Episode).delete()
    db.query(Season).delete()
    db.query(Show).delete()
    db.commit()

    shows_map = {}
    seasons_map = {}

    print(f"Processing {len(seed_data)} episode records...")
    for item in seed_data:
        show_title = item.get("show_title")
        if not show_title:
            continue

        # Find or create Show
        if show_title not in shows_map:
            show = Show(
                id=str(uuid.uuid4()),
                title=show_title,
                slug=item.get("slug") or show_title.lower().replace(" ", "-"),
                synopsis=item.get("synopsis"),
                section=item.get("section"),
                status=item.get("status", "draft")
            )
            db.add(show)
            db.flush()
            shows_map[show_title] = show

            # Add show poster & banner if available in asset template
            poster_art = Artwork(
                id=str(uuid.uuid4()),
                show_id=show.id,
                artwork_type="poster",
                storage_key=sample_poster_key,
                url=f"/media/{sample_poster_key}",
                width=600,
                height=900,
                size_bytes=9292
            )
            banner_art = Artwork(
                id=str(uuid.uuid4()),
                show_id=show.id,
                artwork_type="banner",
                storage_key=sample_banner_key,
                url=f"/media/{sample_banner_key}",
                width=1280,
                height=720,
                size_bytes=15028
            )
            db.add(poster_art)
            db.add(banner_art)
        else:
            show = shows_map[show_title]
            # If any episode has a valid section and show was missing it, keep consistency
            if not show.section and item.get("section"):
                show.section = item.get("section")
            if item.get("status") == "published":
                show.status = "published"

        # Find or create Season
        season_num = item.get("season_number", 1)
        season_key = (show.id, season_num)
        if season_key not in seasons_map:
            season = Season(
                id=str(uuid.uuid4()),
                show_id=show.id,
                season_number=season_num
            )
            db.add(season)
            db.flush()
            seasons_map[season_key] = season
        else:
            season = seasons_map[season_key]

        # Create Episode
        ep_id = item.get("episode_id") or str(uuid.uuid4())
        categories = item.get("categories", [])
        primary_cat = categories[0] if categories else None

        episode = Episode(
            id=ep_id,
            season_id=season.id,
            episode_number=item.get("episode_number", 1),
            title=item.get("episode_title") or f"Episode {item.get('episode_number', 1)}",
            synopsis=item.get("synopsis"),
            duration_seconds=item.get("duration_seconds"),
            category=primary_cat,
            categories_json=json.dumps(categories),
            language=item.get("language", "en"),
            content_group=item.get("content_group"),
            status=item.get("status", "draft")
        )
        db.add(episode)
        db.flush()

        # Attach Episode Artwork if available in seed
        artwork_available = item.get("artwork_available", [])
        if "thumbnail" in artwork_available:
            thumb_art = Artwork(
                id=str(uuid.uuid4()),
                episode_id=episode.id,
                artwork_type="thumbnail",
                storage_key=sample_thumb_key,
                url=f"/media/{sample_thumb_key}",
                width=640,
                height=360,
                size_bytes=4308
            )
            db.add(thumb_art)

    db.commit()
    shows_count = db.query(Show).count()
    episodes_count = db.query(Episode).count()
    artworks_count = db.query(Artwork).count()
    print(f"Successfully loaded seed data: {shows_count} shows, {episodes_count} episodes, {artworks_count} artworks.")
    db.close()

if __name__ == "__main__":
    load_seed_data()
