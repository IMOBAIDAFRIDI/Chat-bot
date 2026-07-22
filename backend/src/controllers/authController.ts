import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "../services/prisma";
import { generateToken } from "../utils/jwt";
import { AuthenticatedRequest } from "../middleware/auth";
import { EmailService } from "../services/email";

const sendOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
});

const verifyOtpSchema = z.object({
  email: z.string().email("Invalid email address"),
  code: z.string().length(6, "OTP code must be 6 digits"),
  name: z.string().optional(),
});

export async function sendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = sendOtpSchema.parse(req.body);

    // Generate 6-digit OTP code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Remove older OTPs for this email
    await prisma.otpCode.deleteMany({ where: { email } });

    // Save OTP to DB
    await prisma.otpCode.create({
      data: {
        email,
        code,
        expiresAt,
      },
    });

    // Send Email via SMTP
    const sent = await EmailService.sendOtpEmail(email, code);

    res.json({
      message: sent
        ? "Verification code sent to your Gmail address."
        : "Verification code generated successfully.",
      // Include code in response if SMTP is not configured yet for easy testing
      ...(!sent && { devOtpCode: code }),
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, code, name } = verifyOtpSchema.parse(req.body);

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

    // Find or create user
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      const defaultName = name && name.trim() ? name.trim() : email.split("@")[0];
      user = await prisma.user.create({
        data: {
          email,
          name: defaultName,
          isVerified: true,
        },
      });
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
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
