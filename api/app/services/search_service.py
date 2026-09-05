import json
from typing import List, Optional, Dict, Any
from app.storage import get_storage
from app.schemas.catalog import SearchResultItem, CatalogueEpisode

class SearchService:
    @staticmethod
    def search_catalogue(
        q: Optional[str] = None,
        category: Optional[str] = None,
        language: Optional[str] = None,
        section: Optional[str] = None
    ) -> List[SearchResultItem]:
        storage = get_storage()
        final_key = "catalog/catalogue.json"

        if not storage.exists(final_key):
            return []

        try:
            raw_data = storage.get(final_key)
            catalogue = json.loads(raw_data.decode("utf-8"))
        except Exception:
            return []

        all_shows: List[Dict[str, Any]] = catalogue.get("all_shows", [])
        results: List[SearchResultItem] = []

        q_lower = q.lower().strip() if q else None
        cat_lower = category.lower().strip() if category else None
        lang_lower = language.lower().strip() if language else None
        sec_lower = section.lower().strip() if section else None

        for show in all_shows:
            # 1. Compose Section filter
            if sec_lower and show.get("section", "").lower() != sec_lower:
                continue

            # 2. Gather show categories
            show_cats = [c.lower() for c in show.get("categories", [])]
            if cat_lower and cat_lower not in show_cats:
                continue

            # Check matching episodes and language filter
            matched_episodes: List[CatalogueEpisode] = []
            show_title_match = False

            if q_lower:
                if q_lower in show.get("title", "").lower() or q_lower in show.get("synopsis", "").lower() or any(q_lower in c for c in show_cats):
                    show_title_match = True

            for season in show.get("seasons", []):
                for ep in season.get("episodes", []):
                    ep_langs = [l.lower() for l in ep.get("languages", [])]
                    ep_cats = [c.lower() for c in ep.get("categories", [])]
                    if ep.get("category"):
                        ep_cats.append(ep["category"].lower())

                    # Language filter (composition)
                    if lang_lower and lang_lower not in ep_langs:
                        continue

                    # Category filter on episode level
                    if cat_lower and cat_lower not in ep_cats and cat_lower not in show_cats:
                        continue

                    # Query filter on episode
                    if q_lower:
                        ep_title_matches = (
                            q_lower in ep.get("title", "").lower() or
                            q_lower in ep.get("synopsis", "").lower() or
                            any(q_lower in c for c in ep_cats)
                        )
                        if ep_title_matches or show_title_match:
                            matched_episodes.append(CatalogueEpisode(**ep))
                    else:
                        matched_episodes.append(CatalogueEpisode(**ep))

            # If user queried 'q' and show title didn't match and no episodes matched, skip
            if q_lower and not show_title_match and not matched_episodes:
                continue

            # If language filter specified and no episodes in that language, skip show
            if lang_lower and not matched_episodes:
                continue

            results.append(SearchResultItem(
                show_id=show["id"],
                show_title=show["title"],
                section=show["section"],
                categories=show.get("categories", []),
                poster_url=show.get("poster_url"),
                banner_url=show.get("banner_url"),
                matched_episodes=matched_episodes
            ))

        return results
