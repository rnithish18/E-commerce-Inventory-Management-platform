# ShopNest — Supabase + Render Deployment Guide

## 1. Architecture Overview

ShopNest is deployed as a single Node.js service on **Render** backed by a **Supabase** PostgreSQL database.

```
Browser → Render Web Service (Express + Vite bundle)
               │
               ├─ /api/v1/* → Express routes
               ├─ /health    → Liveness probe
               └─ /uploads   → Static file serving
                      │
               Supabase PostgreSQL (pooler URL)
```

> **Cold-start note (free tier)**: Render free services sleep after 15 min of inactivity. The reservation-expiry sweep runs on boot. Configure `/health` as the liveness/readiness probe in Render's health check settings.

---

## 2. Required Environment Variables

Set all of the following in Render → **Environment** before deploying.

| Variable | Required | Example / Notes |
|----------|----------|-----------------|
| `DATABASE_URL` | ✅ Yes | Use the **pooler** URL from Supabase: `postgresql://postgres.[ref]:[pwd]@aws-0-*.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | ✅ Yes | At least 64 random characters. Generate: `openssl rand -hex 64` |
| `NODE_ENV` | ✅ Yes | Set to `production` |
| `FRONTEND_URL` | ✅ Yes | Your Render service URL e.g. `https://shopnest.onrender.com` |
| `ALLOWED_ORIGINS` | ✅ Yes | Same as `FRONTEND_URL` (or comma-separated if multiple) |
| `ADMIN_EMAIL` | ✅ Yes | Admin login email e.g. `admin@shopnest.com` |
| `ADMIN_PASSWORD` | ✅ Yes | Strong password — this is set by the seed script on first run |

---

## 3. Optional Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DEMO_MODE` | `false` | Set to `true` to seed 10 demo customer accounts |
| `SEED_ALLOW_WIPE` | `false` | Must be `true` to run the seed in production (destructive) |
| `SELLER_GSTIN` | _(empty)_ | Your GSTIN for real tax invoices; leave blank for DEMO INVOICE banner |
| `RAZORPAY_KEY_ID` | — | Razorpay Key ID (live or test) |
| `RAZORPAY_KEY_SECRET` | — | Razorpay Key Secret |
| `RAZORPAY_WEBHOOK_SECRET` | — | Razorpay Webhook Signing Secret |
| `MOCK_GATEWAY` | `true` | Set `false` to use real Razorpay instead of the mock gateway |
| `SMTP_HOST` | — | SMTP server hostname for transactional emails |
| `SMTP_PORT` | `587` | SMTP port |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `OPENAI_API_KEY` | — | OpenAI API key for AI image analysis (optional) |

---

## 4. Supabase SSL / Connection Notes

- **App connections**: Use the **Session Pooler** URL (port 6543) from Supabase → Settings → Database → Connection Pooling.
- **Migrations**: Use the **direct** (non-pooled) URL (port 5432) for `node-pg-migrate` since it requires a persistent connection.
- SSL is configured **programmatically** in `backend/src/db/pool.ts`:
  ```typescript
  ssl: process.env.DATABASE_URL?.includes('supabase')
    ? { rejectUnauthorized: false }
    : undefined
  ```
- ⚠️ **Do NOT** set `NODE_TLS_REJECT_UNAUTHORIZED=0` as an environment variable — this disables TLS verification globally and is a security risk.

---

## 5. Build & Migration Commands

Configure these in Render → **Settings** → Build & Deploy:

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index.js` |

Run migrations before the first deploy (or in a Render **pre-deploy job**):

```bash
# From workspace root (runs against DATABASE_URL in .env)
npm --prefix backend run migrate:up

# Seed initial data (only run once; requires SEED_ALLOW_WIPE=true in production)
SEED_ALLOW_WIPE=true DEMO_MODE=true npm --prefix backend run seed
```

---

## 6. CORS / CSRF Origin Guard

ShopNest uses an **origin-based CSRF guard** (no double-submit cookie needed) on all state-mutating requests.

| Condition | Decision |
|-----------|----------|
| `GET / HEAD / OPTIONS` | ✅ Always allowed |
| URL contains `/webhooks` | ✅ Allowed (HMAC-verified, server-to-server) |
| `Origin` host matches server host | ✅ Allowed (same-origin) |
| `Origin` in `ALLOWED_ORIGINS` / `FRONTEND_URL` | ✅ Allowed |
| Cookie present, no `Origin` header | ❌ **403 CSRF_BLOCKED** |
| Any other cross-origin | ❌ **403 FORBIDDEN_ORIGIN** |

Render automatically injects `RENDER_EXTERNAL_URL` — the security middleware picks this up automatically with no extra config.

---

## 7. Health Check / Liveness Probe

Configure in Render → **Health & Alerts**:

- **Health Check Path**: `/health`
- **Expected response**: HTTP 200 with `{ "status": "ok" }`

The `/health` endpoint returns:

```json
{
  "status": "ok",
  "db": "connected",
  "uptime": 1842,
  "version": "1.0.0",
  "env": "production"
}
```

If the database is unreachable, `status` becomes `"degraded"` and `db` becomes `"disconnected"`.

---

## 8. Webhook Configuration (Razorpay)

Set the Razorpay webhook URL to:
```
https://<your-render-url>/api/v1/webhooks/razorpay
```

Webhook endpoints are **exempt** from origin checking because they are server-to-server calls, verified with HMAC-SHA256 signature against `RAZORPAY_WEBHOOK_SECRET`.

---

## 9. Operational Runbook

### View Logs
```bash
# In Render dashboard → Logs tab, or via Render CLI:
render logs --service shopnest-backend --tail
```

### Re-run Migrations
```bash
DATABASE_URL=<your-supabase-url> npm --prefix backend run migrate:up
```

### Manual Health Check
```bash
curl https://shopnest.onrender.com/health
```
