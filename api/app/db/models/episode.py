import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class Episode(Base):
    __tablename__ = "episodes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    season_id = Column(String(36), ForeignKey("seasons.id", ondelete="CASCADE"), nullable=False, index=True)
    episode_number = Column(Integer, nullable=False, default=1)
    title = Column(String(255), nullable=False, index=True)
    synopsis = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)  # Required to publish (> 0)
    category = Column(String(100), nullable=True, index=True)  # Primary category (adventure, india, etc.)
    categories_json = Column(Text, nullable=True)  # JSON array string for multiple categories
    language = Column(String(10), nullable=False, default="en", index=True)  # en, hi
    content_group = Column(String(100), nullable=True, index=True)  # Variants sharing content_group collapse on publish
    status = Column(String(20), nullable=False, default="draft", index=True)  # draft, published
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    season = relationship("Season", back_populates="episodes")
    artwork = relationship("Artwork", back_populates="episode", cascade="all, delete-orphan", foreign_keys="Artwork.episode_id")

    __table_args__ = (
        Index("ix_episodes_content_group_lang", "content_group", "language"),
    )
