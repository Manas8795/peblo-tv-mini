FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source, migrations, seed, and reference files
COPY app/ ./app/
COPY alembic/ ./alembic/
COPY alembic.ini .
COPY seed/ ./seed/
COPY entrypoint.sh .
RUN chmod +x entrypoint.sh

# Copy seed reference files and assets from root context
COPY seed_shows.json .
COPY reference.json .
COPY assets/ ./assets/

# Storage directory
RUN mkdir -p /app/storage/artwork /app/storage/catalog

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
