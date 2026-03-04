import express from "express";
import { getDepartments } from "../controllers/deptController.js";

const router = express.Router();

router.get("/", getDepartments);

export default router;
