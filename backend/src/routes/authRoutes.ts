import { Router } from "express";
import { signup, login, getProfile } from "../controllers/authController";
import { authenticateJWT } from "../middleware/auth";
import { authRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/signup", authRateLimiter, signup);
router.post("/login", authRateLimiter, login);
router.get("/me", authenticateJWT, getProfile);

export default router;
