import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.db.base import Base

class Season(Base):
    __tablename__ = "seasons"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    show_id = Column(String(36), ForeignKey("shows.id", ondelete="CASCADE"), nullable=False, index=True)
    season_number = Column(Integer, nullable=False, default=1)  # 0 = trailers, 1..N = normal seasons

    show = relationship("Show", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan", order_by="Episode.episode_number")

    __table_args__ = (
        UniqueConstraint("show_id", "season_number", name="uq_season_show_number"),
    )
