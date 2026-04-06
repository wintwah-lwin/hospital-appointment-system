# CP3407-Project

> **Note:** Rename this title / repo description when your subject brief is final.  
> **Codebase:** IntelliCare **hospital appointment and resource allocation** system (patients, admin, queues, security).

This is a group project for **CP3407 – Advanced Software Project**.  
The application is a full-stack **hospital appointment & resource management** system with JWT auth, MongoDB, and admin tooling.

---

## Team – Practical A Group 11

1. **Thi Han Htun**  
   - Fullstack Development  
   - Database & API Integration  
   - Cloud Integration (e.g. MongoDB Atlas deployment)

2. **Phyo Amie**  
   - Backend Development  

   - UI/UX Design (Figma)  
   - Data Management

3. **Wint Wah Lwin**  
   - Frontend Development  
   - React & UI components (Tailwind)  
   - Documentation  
   - Testing and Reporting  

4. **Min Thiha Kyaw**  
   - Frontend Development  
   - React & UI components (Tailwind)  
   - Documentation  
   - Testing and Reporting  
---

## Project goals

- Book **consultation sessions** from a doctor timetable (time bands with **1st / 2nd** sessions)
- **JWT**-based login for patients, staff, and admins
- **MongoDB** persistence (local or Atlas) for users, doctors, schedules, appointments, rooms (`beds`), notifications
- Patients: browse availability, book, reschedule, see bookings  
- Admin/staff: doctor schedules, booking load, appointments list & detail, security / login events, room bookings

---

## Tech stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18 + Vite + React Router + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | MongoDB (Mongoose), local **or** MongoDB Atlas |
| **Auth** | JWT (root `.env`: `JWT_SECRET`, optional admin/staff seed) |
| **Version control** | Git + GitHub |

---

## Run locally

**Full guide:** [docs/run-locally.md](docs/run-locally.md) · **Server overview:** [docs/server.md](docs/server.md)

**Short version:**

1. Copy `.env.example` → `.env` at the repo root. Set `MONGO_URI`, `JWT_SECRET`, optional admin/staff vars. Optional: `VITE_API_BASE_URL`.
2. `npm install` at repo root **and** `npm install` in `server/`.
3. From root: `npm run dev:full` (API on **5001**, Vite on **5173**).

See the root README history in git for path tips if `cd` / `npm run dev` fails.

---

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | React app: patient, admin, staff, kiosk, auth |
| `server/` | Express API, Mongoose models, jobs |
| `docs/` | Extra guides: run locally, backend overview, appointment statuses |
| `.env` | Local secrets at repo root (not committed; see `.env.example`) |

**Roles:** Admin `/admin` · Staff `/staff` · Patient `/patient` · Kiosk `/kiosk`

---

## Iteration 1 (Week 3 – Week 6)

> Foundation: data model, schedules, and core booking.

### Delivered features (example — adjust to your burndown)

1. **Doctor & room model, working schedule slots** – High – *estimate / actual*  
2. **Patient booking against timetable** – High  
3. **Availability & capacity (two sessions per time band)** – High  
4. **Admin doctor CRUD & schedule editor** – Medium  

📝 Weekly GitHub updates and progress check-ins during practicals.

---

## Iteration 2 (Week 7 – Week 10)

> Auth hardening, admin operations, and polish.

### Delivered features (example)

1. **User registration / roles (patient, staff, admin)** – High  
2. **JWT auth & protected routes** – High  
3. **Reschedule / cancel flows** – High  
4. **Admin: booking load, appointments list & detail, room bookings** – Medium  
5. **Security / login events / notifications** – Medium  
6. **Search & filters (specialty, date, room)** – Medium  

### Additional

- CORS and input validation on API  
- Appointment status lifecycle ([docs/status-lifecycle.md](docs/status-lifecycle.md))  
- Responsive UI for desktop and mobile  

**Adjust estimates and “actual velocity”** to match your subject spreadsheet.

---

## Testing

- Manual e2e: register, book, admin review, staff queue  
- Role-based access (patient vs admin)  
- MongoDB local **and/or** Atlas connection  
- Responsive checks on common breakpoints  

---

## Project resources

- [Run locally](./docs/run-locally.md)  
- [Server / API notes](./docs/server.md)  
- [Appointment statuses](./docs/status-lifecycle.md)  
- *(Add: Iteration 1 / 2 markdown, Figma link, demo video — when ready)*  

---

## Status

Project in active development / submission — update this line when your milestone is locked.
