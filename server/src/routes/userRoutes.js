import express from "express";
import { listPatients, getPatientById, banPatient, unbanPatient, deletePatient } from "../controllers/userController.js";
import { listPasswordResetRequests, approvePasswordResetRequest } from "../controllers/passwordResetController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/password-reset-requests", requireAuth, requireRole("admin"), listPasswordResetRequests);
router.post("/password-reset-requests/:id/approve", requireAuth, requireRole("admin"), approvePasswordResetRequest);

router.get("/patients", requireAuth, requireRole("admin"), listPatients);
router.get("/patients/:id", requireAuth, requireRole("admin"), getPatientById);
router.post("/patients/:id/ban", requireAuth, requireRole("admin"), banPatient);
router.post("/patients/:id/unban", requireAuth, requireRole("admin"), unbanPatient);
router.delete("/patients/:id", requireAuth, requireRole("admin"), deletePatient);

export default router;
