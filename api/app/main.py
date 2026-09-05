import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.config import settings
from app.db.base import Base
from app.db.session import engine
from app.api.routes import health, shows, seasons, episodes, artwork, publish, catalog, validation

# Create database tables automatically if not already present
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Peblo TV Mini backend API: CMS CRUD, artwork uploads, atomic publish pipeline, public viewer catalog."
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local media directory for artwork preview serving
media_dir = Path(settings.LOCAL_STORAGE_PATH).resolve()
media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

# Include Routers
app.include_router(health.router)
app.include_router(shows.router)
app.include_router(seasons.router)
app.include_router(episodes.router)
app.include_router(artwork.router)
app.include_router(publish.router)
app.include_router(catalog.router)
app.include_router(validation.router)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "docs": "/docs",
        "catalog": "/catalog",
        "health": "/health"
    }
