# ShopNest — Phase 1 Security Audit Report

**Date**: 2026-11-13  
**Scope**: Credential hardening, secret management, seed guards, documentation

---

## 1. Audit Findings

| ID | Finding | Severity | Location |
|----|---------|----------|----------|
| SEC-01 | `ADMIN_PASSWORD` hardcoded as bcrypt hash in seed script | **HIGH** | `backend/src/db/seed.ts` |
| SEC-02 | Plaintext `Admin@123!` logged to stdout after every seed run | **HIGH** | `backend/src/db/seed.ts` |
| SEC-03 | Admin email + password exposed in `README.md` demo table | **HIGH** | `README.md` |
| SEC-04 | Supabase connection string with password appeared in chat/session logs | **HIGH** | External — rotate immediately |
| SEC-05 | `docs/deployment.md` and other docs referenced demo credentials | **MEDIUM** | `docs/` |
| SEC-06 | No `SEED_ALLOW_WIPE` guard — seed could truncate production DB silently | **HIGH** | `backend/src/db/seed.ts` |
| SEC-07 | Demo customers always seeded regardless of environment | **MEDIUM** | `backend/src/db/seed.ts` |

---

## 2. Mitigations Applied (Phase 1)

### 2.1 `seed.ts` Hardened

| Change | Before | After |
|--------|--------|-------|
| Admin password source | Hardcoded `'Admin@123!'` | `process.env.ADMIN_PASSWORD` (throws in production if unset) |
| Admin email source | Hardcoded `'admin@shopnest.com'` | `process.env.ADMIN_EMAIL \|\| 'admin@shopnest.com'` |
| stdout password leak | `console.log('  Admin:    admin@shopnest.com   / Admin@123!')` | `console.log(\`  Admin:    ${adminEmail}   / [from ADMIN_PASSWORD env]\`)` |
| Demo customers | Always inserted | Gated behind `DEMO_MODE=true` |
| Production wipe guard | None | Throws if `NODE_ENV=production && SEED_ALLOW_WIPE !== 'true'` |

### 2.2 README Cleaned

Replaced the plaintext credentials table with a security-aware table that:
- References `ADMIN_EMAIL` env var instead of printing the email
- Shows demo customer credentials only under `DEMO_MODE=true` context
- Links to `docs/deployment.md` for Render setup

### 2.3 `.gitleaks.toml` Added

Gitleaks secret-scanning configuration added to workspace root:
- Extends the default ruleset
- Custom rule detects Supabase connection strings with embedded passwords
- Allowlist for `.env.example`, `docs/`, `README.md` where demo credentials are intentionally documented

### 2.4 `.env.example` Updated

Added documented entries for `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `DEMO_MODE`, `SEED_ALLOW_WIPE`, `SELLER_GSTIN`, SMTP, and `OPENAI_API_KEY`.

### 2.5 `/health` Endpoint Refactored

Moved inline health handler to `backend/src/routes/health.ts` with proper fields: `status`, `db`, `uptime`, `version`, `env`.

---

## 3. Action Required by Developer

> These steps must be completed by the repository owner — they cannot be automated.

| Action | Priority | Instructions |
|--------|----------|-------------|
| **Rotate Supabase DB password** | 🔴 CRITICAL | Supabase Dashboard → Settings → Database → Reset Password. Update `DATABASE_URL` in Render immediately. |
| **Set `ADMIN_PASSWORD` on Render** | 🔴 CRITICAL | Render → Environment → Add `ADMIN_PASSWORD=<strong-password>`. Re-run seed. |
| **Set `NODE_ENV=production` on Render** | 🔴 CRITICAL | Render → Environment → `NODE_ENV=production`. Without this, production guards are inactive. |
| **Remove any exposed credentials from chat/commit history** | 🟠 HIGH | Use `git-filter-repo` or BFG to scrub secrets from git history if they were ever committed. |
| **Enable Gitleaks in CI** | 🟡 MEDIUM | Add `gitleaks detect` step to GitHub Actions workflow. |

---

## 4. CSRF Protection Summary

| Layer | Implementation |
|-------|---------------|
| Origin guard | `csrfProtection` middleware in `security.ts` checks `Origin`/`Referer` on all mutating methods |
| Webhook exemption | `/api/v1/webhooks/**` bypasses origin guard; all payloads verified with HMAC-SHA256 |
| Cookie flags | `sameSite: 'strict'`, `httpOnly: true`, `secure: true` (production) |
| Trusted origins | `FRONTEND_URL`, `PUBLIC_URL`, `RENDER_EXTERNAL_URL`, `ALLOWED_ORIGINS` env vars |

---

## 5. Auth Security Summary

| Control | Implementation |
|---------|---------------|
| Password hashing | `bcryptjs` with 12 salt rounds |
| Session tokens | JWT signed with `JWT_SECRET` (HS256), stored in `httpOnly` `sameSite=strict` cookies |
| Auth rate limiting | 30 attempts / 15 min / IP on login + register endpoints |
| Coupon brute-force | 40 attempts / 10 min / IP on coupon validation |
| RBAC | `requireAuth` + `requireRole('ADMIN')` middleware on all admin routes |
| Token expiry | Configurable via `JWT_EXPIRES_IN` (default: `7d`) |

---

## 6. Remaining Recommendations (Phase 2)

- [ ] Add Dependabot / `npm audit` to CI for dependency vulnerability scanning
- [ ] Implement refresh token rotation to reduce JWT long-lived token risk
- [ ] Add CSP `nonce`-based script execution (replace `'unsafe-inline'`)
- [ ] Enable Supabase Row Level Security (RLS) as a defence-in-depth layer
- [ ] Add SMTP-based email verification flow for new customer registrations
