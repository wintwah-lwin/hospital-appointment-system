# IntelliCare Resource Allocation

Hospital resource and appointment management: patient booking, doctor schedules, admin dashboards, queues, and security tooling.

## Run locally

See **[docs/RUN_LOCALLY.md](docs/RUN_LOCALLY.md)** for setup, `npm run dev:full`, and troubleshooting.

**You must `cd` into the project folder first.** If `cd intellicare-resource-allocation-5` says “no such file”, it is not in your home directory. For a ZIP in Downloads, use:

```bash
cd ~/Downloads/intellicare-resource-allocation-5
```

Check you are in the right place (you should see `package.json` and a `server/` folder):

```bash
ls package.json server/package.json
```

If `npm run dev` says **Missing script: "dev"**, you are either not in the repo root or you are in `~/` instead of the project.

**Short version:**

1. Run **MongoDB locally** (see [docs/RUN_LOCALLY.md](docs/RUN_LOCALLY.md)), then copy `env/server/.env.example` to `env/server/.env` and set `JWT_SECRET` (and optional `ADMIN_EMAIL` / `ADMIN_PASSWORD`). `MONGO_URI` defaults to `mongodb://127.0.0.1:27017/intellicare`.
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

Admin/staff users are seeded from `env/server/.env`; patients register in the UI.

## Optional: API base URL

Default API is `http://localhost:5001`. To use another host/port, set in `env/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5001
```
