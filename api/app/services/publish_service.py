import json
import uuid
from datetime import datetime
from typing import Dict, List, Any
from sqlalchemy.orm import Session
from app.db.models.show import Show
from app.db.models.season import Season
from app.db.models.episode import Episode
from app.db.models.publish_run import PublishRun
from app.core.constants import SECTIONS
from app.storage import get_storage
from app.schemas.publish import PublishResult

class PublishService:
    @staticmethod
    def execute_publish(db: Session, triggered_by: str = "admin") -> PublishResult:
        run_id = str(uuid.uuid4())
        started_at = datetime.utcnow()
        storage = get_storage()

        # 1. Record run started
        run = PublishRun(
            id=run_id,
            triggered_by=triggered_by,
            started_at=started_at,
            status="started",
            outcome_message="Publish run initiated."
        )
        db.add(run)
        db.commit()

        try:
            # 2. Build Catalogue data structure
            # Fetch published shows with a valid section
            shows = (
                db.query(Show)
                .filter(Show.status == "published")
                .filter(Show.section.isnot(None))
                .order_by(Show.title)
                .all()
            )

            catalogue_sections: Dict[str, List[Dict[str, Any]]] = {sec: [] for sec in SECTIONS}
            all_published_shows: List[Dict[str, Any]] = []
            total_episodes_published = 0

            for show in shows:
                # Find artwork
                poster_art = next((a for a in show.artwork if a.artwork_type == "poster"), None)
                banner_art = next((a for a in show.artwork if a.artwork_type == "banner"), None)
                poster_url = poster_art.url if poster_art else (f"/media/artwork/{show.id}_poster.jpg")
                banner_url = banner_art.url if banner_art else (f"/media/artwork/{show.id}_banner.jpg")

                normal_seasons_data: List[Dict[str, Any]] = []
                trailers_data: List[Dict[str, Any]] = []

                # Group seasons
                for season in sorted(show.seasons, key=lambda s: s.season_number):
                    # Filter only published episodes with valid duration
                    published_episodes = [
                        ep for ep in season.episodes 
                        if ep.status == "published" and ep.duration_seconds and ep.duration_seconds > 0
                    ]

                    if not published_episodes:
                        continue

                    # Handle Season 0 = Trailers (Convention 1)
                    if season.season_number == 0:
                        for ep in published_episodes:
                            thumb_art = next((a for a in ep.artwork if a.artwork_type == "thumbnail"), None)
                            trailers_data.append({
                                "id": ep.id,
                                "title": ep.title,
                                "duration_seconds": ep.duration_seconds,
                                "languages": [ep.language],
                                "thumbnail_url": thumb_art.url if thumb_art else f"/media/artwork/{ep.id}_thumb.jpg"
                            })
                        continue

                    # Normal season: Apply content_group collapsing (Convention 2)
                    # Group episodes sharing a content_group
                    collapsed_episodes: Dict[str, Dict[str, Any]] = {}
                    non_grouped_episodes: List[Dict[str, Any]] = []

                    for ep in sorted(published_episodes, key=lambda e: e.episode_number):
                        thumb_art = next((a for a in ep.artwork if a.artwork_type == "thumbnail"), None)
                        banner_art_ep = next((a for a in ep.artwork if a.artwork_type == "banner"), None)
                        
                        ep_cats = [ep.category] if ep.category else []
                        if ep.categories_json:
                            try:
                                ep_cats = json.loads(ep.categories_json)
                            except Exception:
                                pass

                        thumb_url = thumb_art.url if thumb_art else f"/media/artwork/{ep.id}_thumb.jpg"
                        banner_ep_url = banner_art_ep.url if banner_art_ep else None

                        cg = ep.content_group
                        if cg:
                            if cg not in collapsed_episodes:
                                collapsed_episodes[cg] = {
                                    "id": ep.id,
                                    "episode_number": ep.episode_number,
                                    "title": ep.title,
                                    "synopsis": ep.synopsis,
                                    "duration_seconds": ep.duration_seconds,
                                    "category": ep.category,
                                    "categories": ep_cats,
                                    "languages": [ep.language],
                                    "content_group": cg,
                                    "thumbnail_url": thumb_url,
                                    "banner_url": banner_ep_url
                                }
                            else:
                                # Append language to the list if not already present
                                if ep.language not in collapsed_episodes[cg]["languages"]:
                                    collapsed_episodes[cg]["languages"].append(ep.language)
                                    collapsed_episodes[cg]["languages"].sort()
                        else:
                            non_grouped_episodes.append({
                                "id": ep.id,
                                "episode_number": ep.episode_number,
                                "title": ep.title,
                                "synopsis": ep.synopsis,
                                "duration_seconds": ep.duration_seconds,
                                "category": ep.category,
                                "categories": ep_cats,
                                "languages": [ep.language],
                                "content_group": None,
                                "thumbnail_url": thumb_url,
                                "banner_url": banner_ep_url
                            })

                    # Combine collapsed and non-grouped episodes deterministically
                    season_episodes = list(collapsed_episodes.values()) + non_grouped_episodes
                    season_episodes.sort(key=lambda e: e["episode_number"])

                    if season_episodes:
                        normal_seasons_data.append({
                            "season_number": season.season_number,
                            "episodes": season_episodes
                        })
                        total_episodes_published += len(season_episodes)

                # Collect all show categories across episodes
                show_categories = set()
                for s in normal_seasons_data:
                    for ep in s["episodes"]:
                        for c in ep.get("categories", []):
                            if c:
                                show_categories.add(c)
                        if ep.get("category"):
                            show_categories.add(ep["category"])

                show_dict = {
                    "id": show.id,
                    "title": show.title,
                    "slug": show.slug or show.title.lower().replace(" ", "-"),
                    "synopsis": show.synopsis,
                    "section": show.section,
                    "categories": sorted(list(show_categories)),
                    "poster_url": poster_url,
                    "banner_url": banner_url,
                    "seasons": normal_seasons_data,
                    "trailers": trailers_data
                }

                all_published_shows.append(show_dict)
                if show.section in catalogue_sections:
                    catalogue_sections[show.section].append(show_dict)

            # Deterministic ordering within sections
            for sec in catalogue_sections:
                catalogue_sections[sec].sort(key=lambda s: s["title"])

            catalogue_payload = {
                "version": "1.0",
                "published_at": datetime.utcnow().isoformat() + "Z",
                "run_id": run_id,
                "total_shows": len(all_published_shows),
                "total_episodes": total_episodes_published,
                "sections": catalogue_sections,
                "all_shows": all_published_shows
            }

            # 3. ATOMIC WRITE TO STORAGE
            # Step A: Write to a unique temporary staging key
            temp_key = f"catalog/catalogue.{run_id}.json.tmp"
            final_key = "catalog/catalogue.json"
            
            raw_json = json.dumps(catalogue_payload, indent=2, ensure_ascii=False).encode("utf-8")
            storage.put(temp_key, raw_json, content_type="application/json")

            # Step B: Atomic swap (rename / overwrite)
            # If the process crashes before this line, catalogue.json remains untouched
            storage.atomic_publish(temp_key, final_key)

            # 4. Record success outcome in database
            run.finished_at = datetime.utcnow()
            run.status = "success"
            run.shows_count = len(all_published_shows)
            run.episodes_count = total_episodes_published
            run.catalogue_key = final_key
            run.outcome_message = (
                f"Successfully published catalogue: {len(all_published_shows)} shows, "
                f"{total_episodes_published} collapsed episodes across {len(catalogue_sections)} sections."
            )
            db.commit()

            return PublishResult(
                run_id=run_id,
                status="success",
                shows_published=len(all_published_shows),
                episodes_published=total_episodes_published,
                catalogue_url=storage.get_url(final_key),
                message=run.outcome_message
            )

        except Exception as e:
            # Handle failure: record failed run so audit log retains failure details
            db.rollback()
            failed_run = db.query(PublishRun).filter(PublishRun.id == run_id).first()
            if failed_run:
                failed_run.finished_at = datetime.utcnow()
                failed_run.status = "failed"
                failed_run.outcome_message = f"Publish failed: {str(e)}"
                db.commit()
            raise e
