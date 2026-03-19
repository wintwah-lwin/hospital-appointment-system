import express from "express";
import { listLoginEvents, listSecurityAlerts, getSecuritySummary, deleteLoginEvent } from "../controllers/securityController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/login-events", requireAuth, requireRole("admin"), listLoginEvents);
router.delete("/login-events/:id", requireAuth, requireRole("admin"), deleteLoginEvent);
router.get("/alerts", requireAuth, requireRole("admin"), listSecurityAlerts);
router.get("/summary", requireAuth, requireRole("admin"), getSecuritySummary);

export default router;
