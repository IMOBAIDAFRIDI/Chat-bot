import { Router } from "express";
import { sendOtp, verifyOtp, login, getProfile } from "../controllers/authController";
import { authenticateJWT } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/send-otp", authRateLimiter, sendOtp);
router.post("/verify-otp", authRateLimiter, verifyOtp);
router.post("/login", authRateLimiter, login);
router.get("/me", authenticateJWT, getProfile);

export default router;
