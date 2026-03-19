import express from "express";
import { login, registerPatient, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSingaporeNoVPN } from "../middleware/geoRestrict.js";

const router = express.Router();

router.post("/register", requireSingaporeNoVPN, registerPatient);
router.post("/login", requireSingaporeNoVPN, login);
router.get("/me", requireAuth, me);

export default router;
