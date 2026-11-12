# ShopNest — Production Deployment & Containerization Guide

## 1. Architecture Overview
The ShopNest production stack is packaged into isolated Docker containers orchestrated via Docker Compose:
- **`postgres`**: PostgreSQL 15 database engine with persistent volume storage (`shopnest_pgdata`) and healthcheck probes.
- **`backend`**: Node.js 20 multi-stage container executing compiled TypeScript (`dist/index.js`), connected to PostgreSQL and private uploads volume (`shopnest_uploads`).
- **`frontend`**: Production Vite static bundle served via Express with built-in reverse proxy routing for `/api` and `/uploads` directly to the backend service.

---

## 1a. CORS / CSRF Origin Guard

ShopNest uses an **origin-based CSRF guard** (no double-submit cookie needed) on all state-mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`).  The guard is active in every environment.

### How it works

| Condition | Decision |
|-----------|----------|
| `GET / HEAD / OPTIONS` | ✅ Always allowed (safe methods) |
| URL contains `/webhooks` | ✅ Always allowed (HMAC-verified, server-to-server) |
| No `Origin` header + no session cookie | ✅ Allowed (non-browser client, e.g. curl) |
| No `Origin` header + session cookie present | ❌ **403 CSRF_BLOCKED** |
| `Origin` host == server's own host (from `X-Forwarded-Host` / `Host`) | ✅ Allowed (same-origin) |
| `Origin` host is in the allowed-origins set | ✅ Allowed (listed cross-origin) |
| Anything else | ❌ **403 FORBIDDEN_ORIGIN** (rejected origin + allowed list logged at WARN) |

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PUBLIC_URL` | Recommended | Canonical URL of this service. Auto-added to the allowed-origins set. Example: `https://shopnest.onrender.com` |
| `ALLOWED_ORIGINS` | Optional | Comma-separated list of additional origins (frontends, admin panels). Example: `https://admin.shopnest.com,https://app.shopnest.com` |
| `RENDER_EXTERNAL_URL` | — | Injected **automatically** by Render. No action needed. |
| `FRONTEND_URL` | Optional | Legacy / dev convenience. Included in allowed set when set. |

### Trust proxy

`app.set('trust proxy', 1)` is enabled so Render's (and Railway's) reverse proxy headers (`X-Forwarded-Host`, `X-Forwarded-Proto`) are trusted for same-origin detection and secure-cookie marking.

### Render setup

Set the following in Render → **Environment**:

```
PUBLIC_URL=https://shopnest.onrender.com
# Optional extra frontends:
ALLOWED_ORIGINS=https://your-custom-domain.com
```

### Webhook redirect URIs

Webhook endpoints (`/api/v1/webhooks/**`) are exempt from origin checking because:
- They are called by payment providers (Razorpay), not browsers.
- Each request is verified using an HMAC-SHA256 signature against `RAZORPAY_WEBHOOK_SECRET`.

---

## 2. Prerequisites
- Docker Engine 24+ and Docker Compose v2.20+
- (For bare-metal/local development): Node.js 20+ and PostgreSQL 15+

---

## 3. Quick Start (Docker Compose)

### A. Environment Configuration
Ensure your root `.env` file is initialized:
```bash
cp .env.example .env
```

### B. Launch All Services
```bash
docker compose up --build -d
```

### C. Verify Container Health
```bash
docker compose ps
```
All services (`shopnest_postgres`, `shopnest_backend`, `shopnest_frontend`) should report `Up (healthy)` or `Up`.

### D. Run Database Migrations and Seed
```bash
# Execute migrations inside the backend container
docker compose exec backend npm run migrate:up

# Populate initial product catalog, categories, admin, and demo customers
docker compose exec backend npm run seed
```

---

## 4. Operational URLs & Endpoints
- **Storefront & Admin Web App**: `http://localhost:5173`
- **Backend API Gateway**: `http://localhost:4000`
- **Health Check Probes**:
  - `GET http://localhost:4000/health`
  - `GET http://localhost:4000/api/v1/health`

### Sample Health Check Response:
```json
{
  "status": "ok",
  "database": "connected",
  "uptime_seconds": 1842,
  "timestamp": "2026-10-22T14:30:00.000Z",
  "version": "1.0.0"
}
```

---

## 5. Local Bare-Metal Execution (Alternative to Docker)

If running directly on host machines without Docker:

1. **Start PostgreSQL**:
   Ensure PostgreSQL is listening on `127.0.0.1:5432`.
2. **Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
3. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

---

## 6. Production Maintenance Runbook

### A. Database Backup
```bash
docker compose exec postgres pg_dump -U shopnest shopnest_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### B. Database Restore
```bash
cat backup.sql | docker compose exec -T postgres psql -U shopnest -d shopnest_db
```

### C. Container Log Inspection
```bash
docker compose logs -f backend
docker compose logs -f postgres
```
