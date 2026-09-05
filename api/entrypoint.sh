#!/bin/sh
set -e

echo "Starting Peblo TV Mini Backend API..."

# Wait for PostgreSQL if DATABASE_URL points to postgres
if echo "$DATABASE_URL" | grep -q "postgres"; then
  echo "Waiting for PostgreSQL database to be ready..."
  # Simple python probe until connection succeeds
  python -c "
import time, os, sys, psycopg2
db_url = os.environ.get('DATABASE_URL')
for i in range(30):
    try:
        conn = psycopg2.connect(db_url)
        conn.close()
        print('PostgreSQL is ready!')
        sys.exit(0)
    except Exception:
        time.sleep(1)
print('Timeout waiting for PostgreSQL database!')
sys.exit(1)
"
fi

# Run database migrations
echo "Running Alembic database migrations..."
python -m alembic -c alembic.ini upgrade head || true

# Seed database with seed_shows.json and assets if not already seeded
echo "Checking seed data..."
python seed/load_seed_shows.py || echo "Seed execution completed."

# Execute main process
echo "Starting Uvicorn web server on port 8000..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
