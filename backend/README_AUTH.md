# Backend – Authentication API

## Table of Contents
- [Running the server](#running-the-server)
- [Required environment variables](#required-environment-variables)
- [Endpoints](#endpoints)
- [Error format](#error-format)
- [curl examples (Windows PowerShell)](#curl-examples-windows-powershell)

---

## Running the server

```bash
# Install dependencies
cd backend
npm install

# Development (auto-reload with nodemon)
npm run dev

# Production
npm start
```

The server exits with a clear message if `JWT_SECRET` or `DATABASE_URL` are missing.

---

## Required environment variables

Create `backend/.env` (never commit it) with the following keys.
Values are **not** shown here intentionally.

| Key | Required | Default | Purpose |
|-----|----------|---------|---------|
| `DATABASE_URL` | ✅ Yes | – | PostgreSQL connection string (Neon) |
| `JWT_SECRET` | ✅ Yes | – | Secret used to sign/verify JWTs |
| `PORT` | No | `5000` | HTTP port the server listens on |
| `NODE_ENV` | No | `development` | `production` enables secure cookies & hides stack traces |
| `CLIENT_URL` | No | *(none)* | Allowed CORS origin (e.g. `http://localhost:3000`) |

---

## Endpoints

### `GET /api/health`
Health check. No database access.

**Response `200`**
```json
{ "ok": true }
```

---

### `POST /api/auth/register`
Register a new customer account.

**Body**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securePass1"
}
```

| Field | Rules |
|-------|-------|
| `name` | 2–100 characters, trimmed |
| `email` | Valid email, trimmed & lowercased |
| `password` | 8–72 characters |

> **Admin lock:** the `role` field is ignored from the request body. Roles are only set by the database default (`customer`).

**Response `201`**
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure (see [error format](#error-format)) |
| `409` | `{ "error": { "message": "Email already registered" } }` |

---

### `POST /api/auth/login`
Authenticate and receive a session cookie.

**Body**
```json
{
  "email": "jane@example.com",
  "password": "securePass1"
}
```

**Response `200`** + sets `token` cookie (httpOnly, sameSite=lax, secure in production, 1 day)
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `400` | Validation failure |
| `401` | `{ "error": { "message": "Invalid email or password" } }` (same message for wrong email **and** wrong password – no enumeration) |

---

### `POST /api/auth/logout`
Clears the session cookie.

**Response `200`**
```json
{ "ok": true }
```

---

### `GET /api/auth/me`
Returns the current authenticated user. Requires the `token` cookie.

**Response `200`**
```json
{
  "id": 1,
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "customer"
}
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401` | Missing, invalid, or expired token |

---

### `GET /api/admin/ping`
Admin-only health check. Requires the `token` cookie + `role = admin`.

**Response `200`**
```json
{ "ok": true }
```

**Error responses**

| Status | Condition |
|--------|-----------|
| `401` | Not authenticated |
| `403` | `{ "error": { "message": "Admin access required" } }` |

---

## Error format

All errors follow this shape:

```json
{
  "error": {
    "message": "Human-readable summary",
    "details": [
      { "field": "email", "message": "A valid email address is required" }
    ]
  }
}
```

`details` is only present on `400` validation errors.

---

## curl examples (Windows PowerShell)

> Use `curl.exe` (the real curl, not PowerShell's `Invoke-WebRequest` alias).
> Cookies are saved to / loaded from `cookies.txt`.

### Health check
```powershell
curl.exe -s http://localhost:5000/api/health
```

### Register
```powershell
curl.exe -s -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"Jane Doe\",\"email\":\"jane@example.com\",\"password\":\"securePass1\"}"
```

### Login (saves cookie)
```powershell
curl.exe -s -X POST http://localhost:5000/api/auth/login `
  -H "Content-Type: application/json" `
  -c cookies.txt `
  -d "{\"email\":\"jane@example.com\",\"password\":\"securePass1\"}"
```

### Me (sends saved cookie)
```powershell
curl.exe -s http://localhost:5000/api/auth/me `
  -b cookies.txt
```

### Logout (sends saved cookie)
```powershell
curl.exe -s -X POST http://localhost:5000/api/auth/logout `
  -b cookies.txt
```

### Admin ping (sends saved cookie – must be an admin user)
```powershell
curl.exe -s http://localhost:5000/api/admin/ping `
  -b cookies.txt
```

### Validation error example
```powershell
curl.exe -s -X POST http://localhost:5000/api/auth/register `
  -H "Content-Type: application/json" `
  -d "{\"name\":\"J\",\"email\":\"not-an-email\",\"password\":\"short\"}"
```

### Unknown route (404)
```powershell
curl.exe -s http://localhost:5000/api/does-not-exist
```
