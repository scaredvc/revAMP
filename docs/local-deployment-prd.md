# PRD: Local Deployment Option (Prod-Like Stack)

## Summary
Create a first-class local deployment mode so you can run and interact with revAMP locally without touching Vercel/Render services. This should support frontend + backend + database as an isolated stack.

## Why
- Current hosted setup is split across Vercel (frontend) and Render (backend + DB).
- Local experimentation should be safe, fast, and independent from production data/services.
- Team onboarding should be one command instead of manual multi-step setup.

## Current Repo Findings
- Frontend already supports `NEXT_PUBLIC_API_URL` with localhost fallback (`frontend/app/contexts/AuthContext.js`, `frontend/components/mapApp.jsx`, `frontend/app/dashboard/page.jsx`).
- Backend already supports local/prod DB switching via env (`backend/app/core/config.py`).
- Backend can run with SQLite locally today (`DATABASE_URL_LOCAL=sqlite:///./revamp.db` in `backend/env.example`).
- No docker-compose or deploy profile exists for local full-stack orchestration.
- Frontend `.env.example` does not document all required keys (e.g. Google Maps key).

## Goal
Add a **documented, repeatable local stack mode** that runs:
- Next.js frontend on `http://localhost:3000`
- FastAPI backend on `http://localhost:8000`
- Local Postgres (and optional Redis) in containers

## Non-Goals
- Replacing hosted Vercel/Render deployment flow.
- Production infra changes.
- Full CI/CD redesign.

## Success Criteria
- New developer can clone repo and run one command to boot local stack.
- No calls to Render Postgres in local mode.
- Auth and dashboard flows work against local backend + local DB.
- Health checks pass: `/health` and `/health/db`.

## Proposed Local Modes
1. `local-lite` (existing): manual processes + SQLite.
2. `local-stack` (new default recommendation): Docker Compose with Postgres-backed backend.

## Scope of Changes (Implementation Backlog)
1. Add `docker-compose.local.yml`
- Services: `frontend`, `backend`, `postgres`, optional `redis`.
- Add named volumes for DB persistence.
- Add healthchecks and startup ordering.

2. Add container build/runtime files
- `backend/Dockerfile` for FastAPI (`uvicorn app.main:app`).
- `frontend/Dockerfile` (dev-focused) for Next.js.

3. Add local env templates
- `backend/.env.local.example` with local-safe defaults:
  - `APP_ENV=local`
  - `DATABASE_URL=postgresql://...@postgres:5432/...` (for compose)
  - `SECRET_KEY=...`
  - `CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000`
  - `REDIS_URL=redis://redis:6379/0` (if redis enabled)
- `frontend/.env.local.example`:
  - `NEXT_PUBLIC_API_URL=http://localhost:8000`
  - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...`

4. Standardize startup commands
- Add root `Makefile` or `scripts/dev-local.sh` with:
  - `up`, `down`, `logs`, `reset-db`.

5. Documentation
- Update `README.md` with:
  - quick start for `local-stack`
  - troubleshooting (ports in use, CORS, missing Maps key).

6. Validation script/checklist
- Add script or README section to verify:
  - `curl localhost:8000/health`
  - `curl localhost:8000/health/db`
  - frontend loads and fetches `/api/data`.

## Detailed TODO (Execution Order)
- [ ] Add `docker-compose.local.yml` with pinned image versions and volumes.
- [ ] Add `backend/Dockerfile` and verify `uvicorn` entrypoint.
- [ ] Add `frontend/Dockerfile` and verify hot reload behavior.
- [ ] Create `backend/.env.local.example` and `frontend/.env.local.example`.
- [ ] Add `.env.local` loading instructions for both apps.
- [ ] Add root helper commands (`Makefile` or scripts).
- [ ] Update README with local-lite vs local-stack guidance.
- [ ] Run smoke test: auth register/login + dashboard data fetch.
- [ ] Confirm DB persistence across restarts.
- [ ] Confirm no dependency on Render/Vercel in local-stack mode.

## Risks and Mitigations
- Risk: Env drift between hosted and local.
  - Mitigation: separate explicit `.env.local.example` files and docs.
- Risk: CORS misconfiguration blocks browser calls.
  - Mitigation: lock local origins in backend env template and test.
- Risk: Google Maps key missing causes partial UI failures.
  - Mitigation: document required frontend env var and fallback behavior.
- Risk: Postgres connection string incompatibility.
  - Mitigation: test both compose URL and current Render URL handling.

## Open Questions
- Should Redis be required locally or optional?
- Do you want local mode to use SQLite by default or Postgres by default?
- Should local stack include seeded demo users/zones for repeatable testing?
- Do you want local HTTPS support (mkcert + reverse proxy), or HTTP is fine?

## Acceptance Checklist
- [ ] `docker compose -f docker-compose.local.yml up` boots all services.
- [ ] Frontend reachable at `http://localhost:3000`.
- [ ] Backend reachable at `http://localhost:8000/health`.
- [ ] DB health returns OK at `http://localhost:8000/health/db`.
- [ ] Register/login works locally.
- [ ] Dashboard loads parking data locally.
