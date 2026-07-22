import { Router } from "express";
import { sendOtp, verifyOtp, getProfile } from "../controllers/authController";
import { authenticateJWT } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/send-otp", authRateLimiter, sendOtp);
router.post("/verify-otp", authRateLimiter, verifyOtp);
router.get("/me", authenticateJWT, getProfile);

export default router;
