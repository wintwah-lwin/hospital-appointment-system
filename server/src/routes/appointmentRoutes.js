import express from "express";
import {
  createAppointment,
  listMyAppointments,
  listAllAppointments,
  listAppointmentsByRoomAndDate,
  getQueueForDoctor,
  cancelAppointment,
  editAppointment,
  getAppointmentById,
  lookupAppointment,
  checkIn,
  callPatient,
  completeConsultation,
  markNoShow,
  setStatusAdmin,
  completeAndDelete,
  clearAllAppointments
} from "../controllers/appointmentController.js";
import { attachAuth, requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Patient online booking
router.post("/", requireAuth, requireRole("patient"), createAppointment);
router.get("/mine", requireAuth, requireRole("patient"), listMyAppointments);

// Queue (must be before :id)
router.get("/queue/doctor", requireAuth, requireRole("staff", "admin"), getQueueForDoctor);

// Admin: clear all appointments (must be before :id)
router.delete("/clear", requireAuth, requireRole("admin"), clearAllAppointments);

router.get("/by-room", requireAuth, requireRole("admin"), listAppointmentsByRoomAndDate);

// Shared (owner/admin/staff)
router.get("/:id", requireAuth, getAppointmentById);
router.patch("/:id", requireAuth, editAppointment);
router.post("/:id/cancel", requireAuth, cancelAppointment);

// Public: Kiosk lookup (email or Appointment ID) - no auth
router.post("/lookup", lookupAppointment);

// Check-in: staff always; patient for own; OR public with email in body (kiosk self-check-in)
router.post("/:id/check-in", attachAuth, checkIn);

// Staff/Doctor: Queue & consultation
router.patch("/:id/call", requireAuth, requireRole("staff", "admin"), callPatient);
router.patch("/:id/complete", requireAuth, requireRole("staff", "admin"), completeConsultation);
router.patch("/:id/no-show", requireAuth, requireRole("staff", "admin"), markNoShow);
router.patch("/:id/status", requireAuth, requireRole("admin"), setStatusAdmin);
router.delete("/:id", requireAuth, requireRole("admin"), completeAndDelete);

// Admin/staff views
router.get("/", requireAuth, requireRole("staff", "admin"), listAllAppointments);

export default router;
