import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER || "imobaidafridi@gmail.com";
    const pass = process.env.SMTP_PASS || "hlahukrewwepazeb";

    if (!user || !pass) {
      return null;
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  /**
   * Send 6-digit OTP Verification Email to Gmail address via Nodemailer SMTP
   */
  static async sendOtpEmail(email: string, code: string): Promise<boolean> {
    const transporter = this.getTransporter();

    if (!transporter) {
      logger.info(`[SMTP TEST MODE] OTP code for ${email}: ${code}`);
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"Gemini AI Chatbot" <${process.env.SMTP_USER || "imobaidafridi@gmail.com"}>`,
        to: email,
        subject: `${code} is your Verification Code for Gemini AI Chatbot`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <h2 style="color: #10b981; text-align: center; font-size: 22px; margin-bottom: 8px;">Gemini AI Chatbot</h2>
            <p style="font-size: 14px; color: #475569; text-align: center; margin-top: 0;">Account Email Verification</p>
            <p style="font-size: 14px; color: #334155; margin-top: 20px;">Hello,</p>
            <p style="font-size: 14px; color: #334155; leading-height: 1.5;">Thank you for registering. Use the 6-digit verification code below to complete your account sign up:</p>
            <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; text-align: center; margin: 24px 0; border: 1px border-slate-200;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">This verification code will expire in 10 minutes.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Gmail OTP email successfully sent to ${email}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send Gmail OTP email to ${email}:`, error);
      return false;
    }
  }
}
