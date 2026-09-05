import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Text, DateTime
from app.db.base import Base

class PublishRun(Base):
    __tablename__ = "publish_runs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    triggered_by = Column(String(100), nullable=False, default="admin")
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    status = Column(String(20), nullable=False, default="started")  # started, success, failed
    shows_count = Column(Integer, default=0, nullable=False)
    episodes_count = Column(Integer, default=0, nullable=False)
    outcome_message = Column(Text, nullable=True)
    catalogue_key = Column(String(255), nullable=True)
