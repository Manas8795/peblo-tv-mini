import sys
from pathlib import Path

# Add api directory to sys.path
api_dir = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(api_dir))
