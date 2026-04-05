import express from "express";
import {
  login,
  registerPatient,
  me,
  forgotPassword,
  recoverSession,
  changePassword,
  updatePatientProfile
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { requireSingaporeNoVPN } from "../middleware/geoRestrict.js";

const router = express.Router();

router.post("/register", requireSingaporeNoVPN, registerPatient);
router.post("/login", requireSingaporeNoVPN, login);
router.post("/forgot-password", forgotPassword);
router.post("/recover-session", recoverSession);
router.get("/me", requireAuth, me);
router.patch("/password", requireAuth, changePassword);
router.patch("/profile", requireAuth, updatePatientProfile);

export default router;
