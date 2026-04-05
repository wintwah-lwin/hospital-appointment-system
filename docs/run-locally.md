# Run the app on your machine

Use the folder that contains `package.json` and the `server` directory (the repository root). If a command says `Missing script: "dev"`, you are in the wrong directory—run `pwd` and open this project folder first.

## First-time setup

From the project root:

```bash
cp .env.example .env
```

Edit `.env` at the root: set `MONGO_URI`, `JWT_SECRET`, and any admin seed values you need. The frontend reads `VITE_API_BASE_URL` from the same file (defaults are fine for local use).

Install dependencies:

```bash
npm install
cd server && npm install && cd ..
```

## Start everything

One terminal (API + Vite):

```bash
npm run dev:full
```

Or two terminals: in `server/` run `npm run dev`, then at the root run `npm run dev`. Vite usually prints `http://localhost:5173`; the API listens on port 5001 by default.

Check the API: open `http://localhost:5001/api/health`.

## MongoDB

You can use MongoDB on your laptop or MongoDB Atlas.

**Local example (macOS with Homebrew):**

```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

In `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/intellicare
```

When the server starts, you should see a successful database connection in the terminal. You can also browse data with MongoDB Compass using the same URI.

**Atlas:** Put your Atlas connection string in `MONGO_URI` instead. No other code changes are required.

## If something goes wrong

- Frontend cannot reach the API: confirm the backend is running and that `VITE_API_BASE_URL` in `.env` matches the API port.
- Database errors on startup: MongoDB is not running, or `MONGO_URI` is wrong.
