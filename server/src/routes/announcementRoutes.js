import express from "express";
import { listAnnouncements, createAnnouncement, deleteAnnouncement } from "../controllers/announcementController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", listAnnouncements); // public
router.post("/", requireAuth, requireRole("admin"), createAnnouncement);
router.delete("/:id", requireAuth, requireRole("admin"), deleteAnnouncement);

export default router;
