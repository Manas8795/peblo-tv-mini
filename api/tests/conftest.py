import sys
from pathlib import Path
import pytest

# Add api directory to sys.path
api_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(api_dir))

from app.db.base import Base
from app.db.session import engine
from seed.load_seed_shows import load_seed_data

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=engine)
    try:
        load_seed_data()
    except Exception as e:
        print(f"Seed warning: {e}")
    yield

