# IntelliCare Resource Allocation (Frontend Starter)

Modern, minimal-color UI for:
- Public (normal) view: Home, Status, Departments, Login placeholder
- Admin dashboard: Overview, Bed Management, Staff Scheduling placeholder, Emergency Queue, Settings

## Run
```bash
npm install
npm run dev
```

## Notes
- Auth is placeholder (see `src/routes/ProtectedRoute.jsx`)
- Mock data is in `src/mock/data.js`
- Backend integration stubs are in `src/api/`

---

## Backend (Node/Express + MongoDB)

### 1) Setup MongoDB
- Install MongoDB locally OR use MongoDB Atlas.
- Local default (recommended for now): `mongodb://127.0.0.1:27017/intellicare`

### 2) Configure env
Copy:
- `server/.env.example` → `server/.env`
and fill `MONGO_URI` + `JWT_SECRET`.

### 3) Install + run backend
```bash
cd server
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`
Health check: `http://localhost:5000/api/health`

### 4) Run full-stack (client + server together)
From project root:
```bash
npm install
npm run dev:full
```

> The backend auto-seeds demo data if the DB is empty.


### Note: default backend port is 5001 (macOS may reserve 5000).

## New Flow (Login First + Roles)

- First page is `/login`.
- **Admin** → `/admin` (manage doctors + monitor appointments)
- **Staff** → `/staff` (see timetable/bookings + update statuses)
- **Patient** → `/patient` and `/patient/book` (see doctors + book)

### System-managed accounts
Admin + staff are auto-created by backend from `server/.env`. Patients register from the UI.

### Backend (4 lines)
```bash
cd ~/Downloads/intellicare-resource-allocation-5/server
cp .env.example .env
npm install
npm run dev
```

### Frontend (4 lines)
```bash
cd ~/Downloads/intellicare-resource-allocation-5
cp .env.example .env
npm install
npm run dev
```
