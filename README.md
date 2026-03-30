# IntelliCare Resource Allocation

Hospital resource and appointment management: patient booking, doctor schedules, admin dashboards, queues, and security tooling.

## Run locally

See **[docs/RUN_LOCALLY.md](docs/RUN_LOCALLY.md)** for setup, `npm run dev:full`, and troubleshooting.

**Short version:**

1. `cp server/.env.example server/.env` and set `MONGO_URI`, `JWT_SECRET` (and optional `ADMIN_EMAIL` / `ADMIN_PASSWORD`).
2. `npm install` in the repo root and `npm install` in `server/`.
3. `npm run dev:full` from the root, or run `npm run dev` in `server/` and `npm run dev` in the root in two terminals.

- **Frontend:** Vite (default `http://localhost:5173`)
- **API:** Express on `http://localhost:5001` (`/api/health`)

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | React app (Vite), pages, components, auth |
| `server/` | Express API, MongoDB models, jobs ([details](docs/SERVER.md)) |
| `docs/` | Local run guide, server layout, status notes |
| `public/` | Static assets for the frontend |

## Roles

- **Admin** — `/admin`: doctors, patients, booking load, security
- **Staff** — `/staff`: queue and appointments
- **Patient** — `/patient`: book and manage appointments

Admin/staff users are seeded from `server/.env`; patients register in the UI.

## Optional: API base URL

Default API is `http://localhost:5001`. To use another host/port, set in root `.env`:

```env
VITE_API_BASE_URL=http://localhost:5001
```
