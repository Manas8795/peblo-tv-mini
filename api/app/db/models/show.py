import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, DateTime, Index
from sqlalchemy.orm import relationship
from app.db.base import Base

class Show(Base):
    __tablename__ = "shows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), nullable=True, index=True)
    synopsis = Column(Text, nullable=True)
    section = Column(String(50), nullable=True, index=True)  # featured, series, minisodes, songs
    status = Column(String(20), nullable=False, default="draft", index=True)  # draft, published
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan", order_by="Season.season_number")
    artwork = relationship("Artwork", back_populates="show", cascade="all, delete-orphan", foreign_keys="Artwork.show_id")

    __table_args__ = (
        Index("ix_shows_section_status", "section", "status"),
    )
