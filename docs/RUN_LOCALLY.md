# Run locally

## First-time setup

From the project root:

```bash
cp server/.env.example server/.env
# Edit server/.env: set MONGO_URI and JWT_SECRET

npm install
cd server && npm install && cd ..
```

Optional: copy root `.env.example` to `.env` if you need the API on a non-default URL.

## One command (frontend + backend)

```bash
npm run dev:full
```

## Two terminals

**Terminal 1 – API (port 5001):**

```bash
cd server
npm run dev
```

**Terminal 2 – frontend:**

```bash
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

## API health check

`http://localhost:5001/api/health`

## MongoDB

Use a local instance (`mongodb://127.0.0.1:27017/intellicare`) or Atlas; set `MONGO_URI` in `server/.env`.

## Troubleshooting

- **Cannot reach API:** ensure the backend is running and matches `VITE_API_BASE_URL` in root `.env` if you changed the port.
- **Duplicate key / startup errors:** stop the server (Ctrl+C), fix DB or env, then `npm run dev` again in `server/`.
