# What’s in `server/` and when you need it

The **`server/`** folder is the **backend API** (Node.js + Express + MongoDB). The React app talks to it over HTTP (`http://localhost:5001` by default).

You need it **whenever** you run the full app: login, booking, admin, notifications, etc. You only skip it if you were running a purely static demo (this project is not set up for that).

## Entry points

| File | Role |
|------|------|
| **`server/server.js`** | Starts the HTTP server and connects to MongoDB. |
| **`server/src/app.js`** | Express app: middleware, mounts all `/api/...` routes. |

## Folders under `server/src/`

| Folder | What it holds | When it matters |
|--------|---------------|-----------------|
| **`routes/`** | URL → handler wiring (`/api/auth`, `/api/appointments`, …). | Every request hits a route. |
| **`controllers/`** | Request/response logic (create booking, login, list doctors, …). | Business rules live here. |
| **`models/`** | Mongoose schemas (User, Appointment, Doctor, Bed, …). | Defines what’s stored in MongoDB. |
| **`middleware/`** | `requireAuth`, `requireRole`, geo checks for login/register. | Protects routes; filters by JWT role. |
| **`utils/`** | Shared helpers: passwords, schedules, availability, doctor conflicts, notify. | Used by controllers. |
| **`services/`** | Bigger helpers: risk engine for logins, IP/geo checks. | Security / login flows. |
| **`jobs/`** | Background logic (e.g. appointment reminder notifications). | Runs on a schedule from `server.js`. |
| **`config/`** | DB connection (`db.js`). | App startup. |

## API areas (high level)

- **`/api/auth`** — Register, login, “me” (current user).
- **`/api/doctors`** — Doctor CRUD (admin).
- **`/api/appointments`** — Bookings, queue, check-in, staff actions.
- **`/api/beds`** — Rooms/beds used for scheduling and capacity.
- **`/api/schedule`** — Doctor timetables, available slots.
- **`/api/snapshot`** — Hospital status summary for the Status page.
- **`/api/notifications`** — In-app notifications for users.
- **`/api/emergencies`** — Emergency queue collection (used in snapshot counts; no dedicated UI in current app).
- **`/api/security`** — Admin login audit and alerts.
- **`/api/users`** — Admin: patients list, ban, delete.

## Configuration

- **`server/.env`** — Created from **`.env.example`**. Must set **`MONGO_URI`** and **`JWT_SECRET`**. Optional: admin seed, `SKIP_GEO_CHECK=true` for local dev if login geo checks get in the way.

## Do you need the whole server?

**Yes**, for the product as built: the frontend is an SPA that calls these APIs. Removing pieces would mean changing the frontend or accepting broken features.
