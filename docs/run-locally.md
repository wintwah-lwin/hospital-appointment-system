# Run locally

**Repo root** = folder with root `package.json` and `server/`.

## Setup (once)

```bash
cp .env.example .env
```

Set `MONGO_URI` and `JWT_SECRET` in `.env`. Optionally adjust `VITE_API_BASE_URL` (default `http://localhost:5001` is fine).

```bash
npm install && (cd server && npm install)
```

## Run

```bash
npm run dev:full
```

- App: **http://localhost:5173**
- API: **http://localhost:5001** — health: **http://localhost:5001/api/health**

**Or** two terminals: `cd server && npm run dev` 
and (root) `npm run dev`.

## MongoDB

Local `.env` example: `MONGO_URI=mongodb://127.0.0.1:27017/intellicare`  

## Quick fixes
| Problem | Check |
|--------|--------|
| API unreachable | Backend running; `VITE_API_BASE_URL` matches port |
| DB errors | Mongo running; `MONGO_URI` correct |
