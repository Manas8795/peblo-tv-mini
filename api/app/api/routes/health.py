import os
from datetime import datetime
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.storage import get_storage

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Health check endpoint verifying database connectivity and storage accessibility.
    Used by container health checks and uptime monitoring systems.
    """
    db_healthy = False
    storage_healthy = False
    db_error = None
    storage_error = None

    # 1. Test database reachability
    try:
        db.execute(text("SELECT 1"))
        db_healthy = True
    except Exception as e:
        db_error = str(e)

    # 2. Test storage reachability
    try:
        storage = get_storage()
        # Verify storage can check existence or perform operation
        storage.exists("health_check_probe")
        storage_healthy = True
    except Exception as e:
        storage_error = str(e)

    all_ok = db_healthy and storage_healthy
    status_code = status.HTTP_200_OK if all_ok else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if all_ok else "unhealthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "components": {
                "database": {
                    "status": "up" if db_healthy else "down",
                    "error": db_error
                },
                "storage": {
                    "status": "up" if storage_healthy else "down",
                    "error": storage_error
                }
            }
        }
    )
