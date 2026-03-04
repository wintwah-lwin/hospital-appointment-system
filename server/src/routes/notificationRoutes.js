import express from "express";
import { listMyNotifications, markAllRead } from "../controllers/notificationController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listMyNotifications);
router.post("/read-all", requireAuth, markAllRead);

export default router;
