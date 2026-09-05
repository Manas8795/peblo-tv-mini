import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class Artwork(Base):
    __tablename__ = "artworks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    show_id = Column(String(36), ForeignKey("shows.id", ondelete="CASCADE"), nullable=True, index=True)
    episode_id = Column(String(36), ForeignKey("episodes.id", ondelete="CASCADE"), nullable=True, index=True)
    artwork_type = Column(String(20), nullable=False, index=True)  # poster, banner, thumbnail
    storage_key = Column(String(500), nullable=False)
    url = Column(String(500), nullable=False)
    width = Column(Integer, nullable=False)
    height = Column(Integer, nullable=False)
    size_bytes = Column(Integer, nullable=False)
    checksum = Column(String(64), nullable=True)  # sha256
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    show = relationship("Show", back_populates="artwork", foreign_keys=[show_id])
    episode = relationship("Episode", back_populates="artwork", foreign_keys=[episode_id])
