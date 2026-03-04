import express from "express";
import { listDoctors, createDoctor, updateDoctor, deleteDoctor } from "../controllers/doctorController.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = express.Router();

router.get("/", requireAuth, listDoctors);
router.post("/", requireAuth, requireRole("admin"), createDoctor);
router.patch("/:id", requireAuth, requireRole("admin"), updateDoctor);
router.delete("/:id", requireAuth, requireRole("admin"), deleteDoctor);

export default router;
