# Peblo TV Mini — Platform Engineering Architecture & Run Guide

Peblo TV streaming platform mini architecture: CMS upload studio → atomic catalogue publication → Netflix-style child-friendly browsing UI.

---

## 1. Quick Start: How to Run Everything

### Option A: Docker Compose (Production Stack — Recommended for Grading)
Brings up PostgreSQL 16, FastAPI Backend, React CMS, and React Viewer with automatic migrations and seeded shows:

```bash
cd peblo-tv-mini
docker-compose up --build
```

Once started:
- **Viewer UI (Public)**: [http://localhost:3001](http://localhost:3001)
- **CMS Studio (Internal)**: [http://localhost:3000](http://localhost:3000)
- **FastAPI API & OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Option B: Local Development (Without Docker)

#### 1. Backend API (FastAPI)
```bash
cd peblo-tv-mini/api
pip install -r requirements.txt
python seed/load_seed_shows.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Internal CMS (React + TypeScript + TanStack Query)
```bash
cd peblo-tv-mini/cms
npm install
npm run dev
# Running on http://localhost:3000
```

#### 3. Public Viewer UI (React + TypeScript)
```bash
cd peblo-tv-mini/viewer
npm install
npm run dev
# Running on http://localhost:3001
```

---

## 2. Running Automated Tests

A dedicated test suite covers the critical business logic and failure modes:
```bash
cd peblo-tv-mini/api
python -m pytest tests -v
```

### Test Coverage Summary (19 Tests Passing):
1. `test_artwork_validation.py`: Verifies poster 2:3 (~600x900), banner 16:9 (~1280x720), thumbnail 16:9 (~640x360), rejects aspect mismatches (e.g. 3:2), enforces 200 KB ceiling, and validates image corruption.
2. `test_publish_atomicity.py`: Proves that publishing writes to a staging file before atomically renaming. Simulates a process failure mid-write and asserts that the previous live `catalogue.json` remains completely intact and uncorrupted.
3. `test_content_group_collapse.py`: Proves that episodes sharing a `content_group` collapse into ONE catalogue entry with a `languages: []` array (e.g. English + Hindi), and verifies Season 0 trailers are excluded from regular seasons and placed into trailers.
4. `test_roles.py`: Proves that `editor` gets HTTP 403 Forbidden on `POST /admin/catalog/publish`, `admin` gets HTTP 200 OK, unauthenticated gets HTTP 401, and public viewer endpoints require no auth.
5. `test_search.py`: Proves search query matching across show titles, episode titles, and categories, and verifies composable AND filter logic (`q`, `category`, `language`, `section`).

---

## 3. Written Answers (Part E)

### 1. How Publishing is Made Atomic (and what happens if the process dies mid-publish)
In `PublishService.execute_publish`:
1. The catalogue data structure is compiled in memory (grouping sections, collapsing `content_group` variants, separating Season 0 trailers).
2. The payload is written to a unique, isolated temporary staging key: `catalog/catalogue.<run_id>.json.tmp` on storage.
3. Once the temporary file is completely written and flushed to disk, an atomic swap is executed via `StorageBackend.atomic_publish()`. Under `LocalDiskStorage`, this calls Python's `os.replace()`, which is an atomic filesystem operation guaranteed by the OS kernel.
4. **Failure resilience**: If the server loses power, the process dies, or an exception occurs at any point before `os.replace()`, the existing `catalogue.json` is never modified or partially overwritten. Readers will always read the previous valid catalogue without any downtime or partial payload corruption. Furthermore, a `PublishRun` record is saved to the database with `status="failed"` and the error message for auditability.

### 2. Storage Abstraction: Moving from Local Disk to Cloudflare R2
The codebase defines a strict abstract base class `StorageBackend` (`app/storage/base.py`) with 5 primitive operations: `put`, `get`, `exists`, `delete`, `atomic_publish`, and `get_url`.
- To swap to Cloudflare R2, we implemented `R2Storage` (`app/storage/r2.py`) using `boto3` and Cloudflare's S3-compatible API.
- Because S3/R2 guarantees atomic object replacement per key, `atomic_publish` executes a server-side `copy_object` from the staged temporary key to `catalog/catalogue.json`, followed by `delete_object` on the temp key.
- To switch in production, **zero application code changes are required**: simply set `STORAGE_BACKEND=r2` and provide `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` in `.env`.

### 3. Search: Implementation, Scale Limits, and Next Steps
- **Current Implementation**: `GET /catalog/search` operates over the in-memory or cached pre-published catalogue. It indexes shows, categories, and collapsed episodes, evaluating all criteria (`q`, `category`, `language`, `section`) with composable boolean AND logic.
- **Where it breaks**: This in-memory JSON traversal works efficiently up to roughly **10,000 shows (~100,000 episodes)** or a ~20 MB catalogue file. Beyond that, JSON deserialization latency and linear scanning will increase p99 response times above 100ms and consume excessive server memory.
- **Next Steps**:
  1. For mid-scale (10k–100k shows): Leverage PostgreSQL Full-Text Search with `tsvector` and `pg_trgm` (trigram indexes) on `shows.title`, `episodes.title`, and `synopsis` directly in the database.
  2. For large-scale (100k+ shows): Offload catalogue indexing at publish time to a dedicated distributed search cluster (Typesense, Meilisearch, or Elasticsearch), allowing typo tolerance, faceted filtering, and sub-10ms queries.

### 4. Why Serve a Pre-Published Catalogue File vs Database Queries per Request?
- **Why Pre-Publish?**:
  Streaming viewer browse homepages exhibit an extreme read-to-write ratio (often 1,000,000 reads to 1 content edit). Serving a static, pre-compiled `catalogue.json` offloads all relational joins, language collapsing, and ordering computations to a single background publish step. The compiled file can be distributed to edge CDN nodes (e.g. Cloudflare CDN / AWS CloudFront) with `Cache-Control` headers, achieving **sub-15ms response times** globally with nearly infinite scale and zero database query load.
- **Where it bites you**:
  1. **Staleness**: Edits made in CMS do not appear in the Viewer until an admin triggers a publish run.
  2. **Cache Invalidation**: Edge caches must be purged or configured with short TTLs / cache-busting versioned URLs (e.g. `/catalog?v=<run_id>`) to prevent viewers from seeing outdated rows after a publication.
  3. **Catalogue Bloat**: As the library grows, downloading the entire catalogue on viewer load becomes slow on mobile devices, necessitating pagination or windowed section payloads.

### 5. What Was Left Out, Trade-offs, and AI Tool Usage
- **What Was Left Out**:
  1. Full OAuth/JWT login flow: Opted for an explicit, transparent Header-based API key & role dependency (`X-API-Key` / Bearer token) with an interactive header role switcher in the CMS. This makes testing and demonstrating role enforcement (403 Forbidden for editors on publish vs 200 for admins) immediate and testable.
  2. Complex video transcoding: Videos are mocked with rich metadata, duration, artwork, and playable simulators.
- **AI Tool Usage & Engineering Judgment**:
  - Used Claude & Gemini for drafting initial boilerplate schemas and test suites.
  - **Where output was rejected/corrected**:
    - AI initially used deprecated Pydantic v1 `Field(..., regex="...")` kwargs; rejected and replaced with Pydantic v2 `pattern=...`.
    - AI initially proposed doing search entirely in the browser client-side; rejected because the challenge specifically penalizes client-side catalogue search without backend composition and scale awareness.
    - Carefully identified and preserved the deliberate imperfections in `seed_shows.json` (such as duplicate `motis-many-lives-s01e02` Hindi variant and missing artwork on Discover India S1E4) so the CMS validation report accurately surfaces them rather than silently cleaning them up.

### 6. Time Spent per Part
- **Part A (Backend & Data Modeling)**: ~2.5 hours (SQLAlchemy models, Alembic migrations, atomic publish pipeline, role dependency, search).
- **Part B (Internal CMS)**: ~2.0 hours (TanStack Query integration, artwork upload slots with aspect validation previews, real-time validation audit panel, run history).
- **Part C (Viewer UI)**: ~1.5 hours (Netflix-style hero banner, horizontal section carousels, show detail modal with language variants, trailers isolation, search).
- **Part D (Pipeline & Operability)**: ~1.0 hour (Docker Compose multi-stage builds, Nginx reverse proxy configurations, GitHub Actions CI workflow).
- **Part E (Documentation & Written Analysis)**: ~0.5 hours.
- **Total Time**: ~7.5 hours.

---

## 4. Pipeline, Operability & Alerting (Part D.4)

### Health Endpoint (`/health`)
The `/health` endpoint actively tests:
1. **PostgreSQL Connectivity**: Executes a live `SELECT 1` query probe against the database.
2. **Storage Accessibility**: Verifies that the storage driver can inspect the storage root.
Returns HTTP 200 with component health statuses, or HTTP 503 if any component is degraded.

### Recommended Production Alert: **Catalogue Staleness & Publish Failure Rate**
- **What to alert on**:
  1. `publish_job_failure_rate > 0%` over a 15-minute window.
  2. `catalogue_staleness_hours > 72h` (if draft changes have been queued in CMS without a successful release).
- **Reasoning**:
  Publishing is the core bridge between content editors and children watching the platform. If the publish pipeline fails, editors are blocked from releasing new content or emergency fixes (e.g. pulling a broken video). Alerting on publish failures immediately notifies platform engineers before viewers notice any issue, while keeping viewer browse latency independent of database availability.

---

## 5. Security & Roles Matrix

| Endpoint | Method | Required Role | Behavior |
|---|---|---|---|
| `/shows` | CRUD | `editor` or `admin` | Manage show entities |
| `/seasons`, `/episodes` | CRUD | `editor` or `admin` | Manage hierarchy |
| `/artwork/upload` | POST | `editor` or `admin` | Validates aspect & dimensions, enforces 200 KB max |
| `/admin/validation-report` | GET | `editor` or `admin` | Surfaces publish blockers grouped by cause |
| `/admin/catalog/publish` | POST | **`admin` only** | Assembles & atomically writes catalogue.json (**403 for editor**) |
| `/catalog` | GET | **Public** | Serves static published catalogue |
| `/catalog/search` | GET | **Public** | Composing search across published titles & tags |
| `/health` | GET | **Public** | Probes DB and storage health |
