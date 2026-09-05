from typing import Dict, List
from sqlalchemy.orm import Session
from app.db.models.show import Show
from app.db.models.season import Season
from app.db.models.episode import Episode
from app.core.constants import SECTIONS, LANGUAGES
from app.schemas.validation import ValidationReport, ValidationErrorItem

class ValidationService:
    @staticmethod
    def generate_report(db: Session) -> ValidationReport:
        grouped: Dict[str, List[ValidationErrorItem]] = {
            "missing_section": [],
            "missing_duration": [],
            "missing_artwork": [],
            "duplicate_content_group_language": [],
            "draft_status": []
        }

        # 1. Inspect Shows
        shows = db.query(Show).all()
        for show in shows:
            # Check section for published or ready shows
            if not show.section:
                grouped["missing_section"].append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    show_id=show.id,
                    show_title=show.title,
                    issue="Show is missing a section attribute (required for catalogue rows).",
                    action_required=f"Assign a valid section ({', '.join(SECTIONS)}) in Show settings."
                ))
            elif show.section not in SECTIONS:
                grouped["missing_section"].append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    show_id=show.id,
                    show_title=show.title,
                    issue=f"Invalid section '{show.section}'.",
                    action_required=f"Update section to one of: {', '.join(SECTIONS)}."
                ))

            # Check show artwork
            artwork_types = [a.artwork_type for a in show.artwork]
            if "poster" not in artwork_types:
                grouped["missing_artwork"].append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    show_id=show.id,
                    show_title=show.title,
                    issue="Show is missing a 2:3 Poster artwork.",
                    action_required="Upload a 600x900 poster image in Show Editor."
                ))
            if "banner" not in artwork_types:
                grouped["missing_artwork"].append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    show_id=show.id,
                    show_title=show.title,
                    issue="Show is missing a 16:9 Banner artwork for Hero display.",
                    action_required="Upload a 1280x720 banner image in Show Editor."
                ))

            if show.status == "draft":
                grouped["draft_status"].append(ValidationErrorItem(
                    entity_type="show",
                    entity_id=show.id,
                    show_id=show.id,
                    show_title=show.title,
                    issue="Show is currently in Draft status and will not appear in the Viewer catalogue.",
                    action_required="Change status to 'published' once all episodes are validated."
                ))

        # 2. Inspect Episodes
        episodes = db.query(Episode).all()
        seen_cg_lang: Dict[tuple, Episode] = {}

        for ep in episodes:
            show_title = ep.season.show.title if ep.season and ep.season.show else "Unknown"
            show_id = ep.season.show.id if ep.season and ep.season.show else None
            season_num = ep.season.season_number if ep.season else None

            # Duration check
            if not ep.duration_seconds or ep.duration_seconds <= 0:
                grouped["missing_duration"].append(ValidationErrorItem(
                    entity_type="episode",
                    entity_id=ep.id,
                    show_id=show_id,
                    show_title=show_title,
                    episode_title=ep.title,
                    season_number=season_num,
                    episode_number=ep.episode_number,
                    issue="Episode duration is missing or zero.",
                    action_required="Set valid duration in seconds before publishing."
                ))

            # Artwork check
            ep_artworks = [a.artwork_type for a in ep.artwork]
            if "thumbnail" not in ep_artworks:
                grouped["missing_artwork"].append(ValidationErrorItem(
                    entity_type="episode",
                    entity_id=ep.id,
                    show_id=show_id,
                    show_title=show_title,
                    episode_title=ep.title,
                    season_number=season_num,
                    episode_number=ep.episode_number,
                    issue="Episode is missing a 16:9 Thumbnail artwork.",
                    action_required="Upload a 640x360 thumbnail in Episode Editor."
                ))

            # Duplicate (content_group, language) check
            if ep.content_group and ep.language:
                key = (ep.content_group, ep.language)
                if key in seen_cg_lang:
                    first_ep = seen_cg_lang[key]
                    grouped["duplicate_content_group_language"].append(ValidationErrorItem(
                        entity_type="episode",
                        entity_id=ep.id,
                        show_id=show_id,
                        show_title=show_title,
                        episode_title=ep.title,
                        season_number=season_num,
                        episode_number=ep.episode_number,
                        issue=f"Duplicate content_group '{ep.content_group}' for language '{ep.language}' (conflicts with episode '{first_ep.title}').",
                        action_required="Provide a unique content_group key or correct the language tag."
                    ))
                else:
                    seen_cg_lang[key] = ep

            # Draft status notice
            if ep.status == "draft":
                grouped["draft_status"].append(ValidationErrorItem(
                    entity_type="episode",
                    entity_id=ep.id,
                    show_id=show_id,
                    show_title=show_title,
                    episode_title=ep.title,
                    season_number=season_num,
                    episode_number=ep.episode_number,
                    issue="Episode is in Draft status and will be excluded from the published catalogue.",
                    action_required="Set status to 'published' when ready."
                ))

        # Filter out empty categories for clean editor view
        cleaned_grouped = {k: v for k, v in grouped.items() if len(v) > 0}
        total_issues = sum(len(v) for v in cleaned_grouped.values())
        
        # Severe blockers on published content (draft items do not block publishing valid shows)
        published_shows_count = db.query(Show).filter(Show.status == "published", Show.section.isnot(None)).count()
        
        # Blockers: published shows missing section or published episodes missing duration
        published_blockers = [
            item for item in (grouped["missing_section"] + grouped["missing_duration"])
            if item.entity_id in [s.id for s in shows if s.status == "published"] or
               item.entity_id in [e.id for e in episodes if e.status == "published"]
        ]

        return ValidationReport(
            is_publishable=(published_shows_count > 0 and len(published_blockers) == 0),
            total_issues=total_issues,
            grouped_by_cause=cleaned_grouped,
            summary={k: len(v) for k, v in grouped.items() if len(v) > 0}
        )
