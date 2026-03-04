import express from "express";
import { listInstitutions } from "../controllers/institutionController.js";

const router = express.Router();
router.get("/", listInstitutions);

export default router;
