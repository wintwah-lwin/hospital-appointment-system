import express from "express";
import { getSnapshot } from "../controllers/snapshotController.js";

const router = express.Router();

router.get("/", getSnapshot);

export default router;
