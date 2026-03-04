import express from "express";
import { listRoomAvailability } from "../controllers/roomController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Admin/staff can view room availability
router.get("/availability", requireAuth, requireRole("admin", "staff"), listRoomAvailability);

export default router;
