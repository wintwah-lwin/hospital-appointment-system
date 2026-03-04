import express from "express";
import { getEmergencyQueue, addEmergency, deleteEmergency } from "../controllers/emergencyController.js";

const router = express.Router();

router.get("/", getEmergencyQueue);
router.post("/", addEmergency);
router.delete("/:id", deleteEmergency);

export default router;
