import express from "express";
import { getBeds, addBed, toggleBedStatus, deleteBed } from "../controllers/bedController.js";

const router = express.Router();

router.get("/", getBeds);
router.post("/", addBed);
router.patch("/:id/toggle", toggleBedStatus);
router.delete("/:id", deleteBed);

export default router;
