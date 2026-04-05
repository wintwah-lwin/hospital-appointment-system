import express from "express";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import bedRoutes from "./routes/bedRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import scheduleRoutes from "./routes/scheduleRoutes.js";
import securityRoutes from "./routes/securityRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.get("/api/health", (req, res) => res.json({ ok: true, service: "intellicare-api" }));

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/security", securityRoutes);
app.use("/api/users", userRoutes);

export default app;
