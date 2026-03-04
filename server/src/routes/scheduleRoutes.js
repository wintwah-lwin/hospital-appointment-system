import express from "express";
import { getTimetable, getDoctorSchedules, updateDoctorSchedule, getAvailableSlots } from "../controllers/scheduleController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/timetable", requireAuth, getTimetable);
router.get("/available", requireAuth, getAvailableSlots);
router.get("/doctors", requireAuth, getDoctorSchedules);
router.patch("/doctors/:id", requireAuth, requireRole("admin"), updateDoctorSchedule);

export default router;
