import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import emergencyRoutes from "./routes/emergencyRoutes.js";
import snapshotRoutes from "./routes/snapshotRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import roomRoutes from "./routes/roomRoutes.js";
import institutionRoutes from "./routes/institutionRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import userRoutes from "./routes/userRoutes.js";

dotenv.config();

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "intellicare-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/snapshot", snapshotRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/institutions", institutionRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/users", userRoutes);

export default app;
