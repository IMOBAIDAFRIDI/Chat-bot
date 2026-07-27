import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../services/prisma";
import { generateToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../middleware/auth";
import { EmailService } from "../services/email";
import { logger } from "../utils/logger";

const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP code must be 6 digits"),
  name: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Send 6-digit OTP verification code via SMTP email
 */
export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = sendOtpSchema.parse(req.body);

    // Generate random 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Delete existing unexpired codes for this email
    await prisma.otpCode.deleteMany({ where: { email } });

    // Store OTP in Database
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Send SMTP email and verify delivery success
    const sent = await EmailService.sendOtpEmail(email, code);

    if (!sent) {
      return res.status(500).json({ error: "Failed to deliver email. Please check your email address and try again." });
    }

    res.json({
      message: "Verification code sent to your email address. Please check your Inbox / Spam folder.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify OTP code and complete Sign Up with Email, Name & Password
 */
export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, name, password } = verifyOtpSchema.parse(req.body);

    const otpRecord = await prisma.otpCode.findFirst({
      where: {
        email,
        code,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired verification code" });
    }

    // Delete used OTP
    await prisma.otpCode.deleteMany({ where: { email } });

    // Hash password if provided
    let hashedPassword = "";
    if (password && password.trim()) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Find or Create User
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const defaultName = name && name.trim() ? name.trim() : email.split("@")[0];
      user = await prisma.user.create({
        data: {
          email,
          name: defaultName,
          password: hashedPassword,
          isVerified: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          ...(name && name.trim() ? { name: name.trim() } : {}),
          ...(hashedPassword ? { password: hashedPassword } : {}),
        },
      });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Sign In / Login with Email & Password
 */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "No account found with this email address." });
    }

    if (!user.password) {
      return res.status(400).json({ error: "Account exists via OTP verification. Please sign in with OTP or reset password." });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: "Incorrect password. Please try again." });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current authenticated user profile
 */
export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
}
