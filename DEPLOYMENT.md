# IntelliCare – Free Deployment Guide

Everything below uses **free tiers**. No credit card required (except Render, which offers a free tier but may ask for verification).

---

## Part 1: MongoDB Atlas (Database – Free)

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas) and click **Sign up**.
2. Create a free account (Google/GitHub sign-in works).
3. Create a **cluster**:
   - Choose **M0 Free**.
   - Pick a cloud provider (AWS) and region (e.g. Singapore).
   - Click **Create**.
4. Add a database user:
   - **Database Access** → **Add New Database User**
   - Username: `intellicare`
   - Password: choose a strong password and **save it**
   - Database User Privileges: **Read and write to any database**
   - Click **Add User**
5. Allow network access:
   - **Network Access** → **Add IP Address**
   - Click **Allow Access from Anywhere** (0.0.0.0/0)
   - Click **Confirm**
6. Get your connection string:
   - **Database** → **Connect** → **Connect your application**
   - Copy the connection string (e.g. `mongodb+srv://intellicare:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`)
   - Replace `<password>` with your user password.

You’ll use this string in Part 3.

---

## Part 2: GitHub (Code – Free)

1. Create a GitHub account at [github.com](https://github.com) (if needed).
2. Create a new repository:
   - **New repository**
   - Name: `intellicare-resource-allocation`
   - Public
   - Do **not** initialize with README
   - Click **Create repository**
3. Push your project:

```bash
cd /Users/louiswalker/Downloads/intellicare-resource-allocation-5

# Initialize git
git init

# Add all files (gitignore excludes .env – your secrets stay local)
git add .
git status   # Verify that .env and server/.env are NOT listed

# Commit
git commit -m "Initial commit - IntelliCare app"

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/intellicare-resource-allocation.git

# Push
git branch -M main
git push -u origin main
```

Your code is now on GitHub. **Never commit `.env` or `server/.env`** – they contain passwords and secrets.

---

## Part 3: Render (Backend API – Free)

1. Go to [render.com](https://render.com) and sign up with GitHub.
2. Click **New** → **Web Service**.
3. Connect your repo:
   - Choose `intellicare-resource-allocation`.
   - Click **Connect**.
4. Configure:
   - **Name:** `intellicare-api` (or any name)
   - **Region:** Singapore (or nearest)
   - **Branch:** `main`
   - **Root Directory:** `server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables (use the **Add Environment Variable** button):
   | Key | Value |
   |-----|-------|
   | `MONGO_URI` | Your MongoDB Atlas connection string from Part 1 |
   | `JWT_SECRET` | Generate with: `openssl rand -hex 32` |
   | `ADMIN_PASSWORD` | A strong password for the admin account (required in production) |
   | `ADMIN_EMAIL` | Admin email (optional, default: admin@intellicare.local) |
   | `PORT` | `5001` |
6. Click **Create Web Service**.
7. Wait for the deploy to finish. The URL will look like:
   `https://intellicare-api.onrender.com`
8. Save this URL; you’ll use it in Part 4.

---

## Part 4: Vercel (Frontend – Free)

1. Go to [vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New** → **Project**.
3. Import your repository:
   - Select `intellicare-resource-allocation`.
   - Click **Import**.
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** (leave blank – project root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
5. Add environment variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** `https://intellicare-api.onrender.com` (your Render URL from Part 3)
   - Make sure there is no trailing slash.
6. Click **Deploy**.
7. When it’s done, your app will be at something like:
   `https://intellicare-resource-allocation.vercel.app`

---

## Part 5: CORS (usually no changes needed)

Your backend already uses `cors({ origin: true })`, which accepts requests from any origin. That works with Vercel.

If you later restrict CORS and see errors, add your Vercel URL to the allowed origins in `server/src/app.js`.

---

## Security: Keep Passwords Out of Git

- `.env` and `server/.env` are in `.gitignore` – **never remove them**.
- Before pushing, run `git status` and confirm no `.env` files are staged.
- On your server (Render, VPS, etc.), set `JWT_SECRET`, `ADMIN_PASSWORD`, and `MONGO_URI` as environment variables – never put real secrets in code or committed files.
- Use `server/.env.example` as a template. Copy to `server/.env` locally and fill in real values. Never commit `server/.env`.

---

## Summary

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| MongoDB Atlas | Database | 512MB free |
| GitHub | Code hosting | Free |
| Render | Backend API | Free (spins down after inactivity) |
| Vercel | Frontend | Free |

**Note:** Render’s free tier may sleep after ~15 minutes of inactivity. The first request after sleep can take 30–60 seconds to wake the service. This is expected on the free tier.

---

## Troubleshooting: Backend Error

If you see "Cannot reach API" or backend errors:
1. **Vercel:** Add `VITE_API_BASE_URL` = your Render URL in Settings → Environment Variables, then redeploy.
2. **Render:** Ensure backend is Live. Check Logs for MongoDB/startup errors.
3. **MongoDB:** `MONGO_URI` in Render must be correct. Network Access: allow 0.0.0.0/0.

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created
- [ ] GitHub repo created and code pushed
- [ ] Render web service deployed with `MONGO_URI`, `JWT_SECRET`, and `ADMIN_PASSWORD`
- [ ] Vercel project deployed with `VITE_API_BASE_URL` pointing to Render
- [ ] CORS in backend allows the Vercel domain
