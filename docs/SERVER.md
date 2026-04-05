# Backend (`server/` folder)

This folder is the HTTP API: Node.js, Express, and MongoDB. The React app calls it (by default at `http://localhost:5001`). You need it running for login, bookings, admin tools, notifications, and the rest of the product.

## Main entry files

| File | Purpose |
|------|---------|
| `server/server.js` | Connects to MongoDB, starts the HTTP server, runs scheduled jobs. |
| `server/src/app.js` | Express application: middleware and all `/api/...` routes. |

## What lives in `server/src/`

| Folder | Purpose |
|--------|---------|
| `routes/` | Maps URLs to handlers (`/api/auth`, `/api/appointments`, and so on). |
| `controllers/` | Request handling: bookings, login, lists, admin actions. |
| `models/` | Mongoose schemas (users, appointments, doctors, rooms, etc.). |
| `middleware/` | Authentication, roles, optional geo checks on login. |
| `utils/` | Shared helpers: passwords, schedules, availability, notifications. |
| `services/` | Larger pieces (for example login risk and IP checks). |
| `jobs/` | Background work such as appointment reminders. |
| `config/` | Database connection setup. |

## API areas (short map)

- `/api/auth` — Registration, login, current user.
- `/api/doctors` — Doctor records (admin).
- `/api/appointments` — Booking, queue, check-in, staff flows. Admins can use `GET /api/appointments/by-room?room=Room-01&date=YYYY-MM-DD` for a room on a given day.
- `/api/beds` — Rooms; each entry has a `bedId` such as `Room-01`.
- `/api/schedule` — Doctor timetables and slots.
- `/api/notifications` — In-app notifications.
- `/api/security` — Login audit (admin).
- `/api/users` — Patient listing and admin actions.

## Configuration

Environment variables are loaded from `.env` at the repository root (copy from `.env.example`). You must set `MONGO_URI` and `JWT_SECRET`. Optional values include admin seed accounts and `SKIP_GEO_CHECK=true` for local development if geo checks block login.

The frontend and server both read the same root `.env` file.

## Do you need this server?

Yes. The UI is built as a single-page app that depends on these APIs. Turning the server off means those features stop working unless you change the codebase.
