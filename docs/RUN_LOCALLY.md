# Run locally

## Use the correct folder

All `npm` commands below assume your terminal’s **current directory** is the **repository root** (the folder that contains `package.json` and `server/`).

- Downloaded a ZIP on macOS? It is often under **`~/Downloads/intellicare-resource-allocation-5`** (or a similar name with a suffix).
- Cloned with git? `cd` into that clone directory.
- **Error `Missing script: "dev"`** means you ran `npm` from `~` or another folder that is not this project. Run `pwd` and `ls package.json` before `npm run dev`.

## First-time setup

From the project root:

```bash
cp env/server/.env.example env/server/.env
# Edit env/server/.env: set MONGO_URI and JWT_SECRET

npm install
cd server && npm install && cd ..
```

Optional: copy `env/frontend/.env.example` to `env/frontend/.env` if you need the API on a non-default URL (Vite reads only that folder).

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

## MongoDB (local only)

This project is set up for **MongoDB running on your machine**, not Atlas.

1. **Install MongoDB Community** (macOS example with Homebrew):
   ```bash
   brew tap mongodb/brew
   brew install mongodb-community
   brew services start mongodb-community
   ```
   (Or install from [mongodb.com/try](https://www.mongodb.com/try/download/community) and start the `mongod` service.)

2. In **`server/.env`**, use:
   ```env
   MONGO_URI=mongodb://127.0.0.1:27017/intellicare
   ```
   The database name `intellicare` is created when the app first writes data.

3. **Check it’s running:** with the server started you should see `MongoDB connected` in the terminal. You can also use **MongoDB Compass** with connection string `mongodb://127.0.0.1:27017`.

If the API exits with a DB error, MongoDB isn’t running or the URI is wrong.

## Troubleshooting

- **Cannot reach API:** ensure the backend is running and matches `VITE_API_BASE_URL` in root `.env` if you changed the port.
- **Duplicate key / startup errors:** stop the server (Ctrl+C), fix DB or env, then `npm run dev` again in `server/`.
