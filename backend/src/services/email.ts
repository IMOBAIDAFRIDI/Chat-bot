import nodemailer from "nodemailer";
import { logger } from "../utils/logger";

export class EmailService {
  private static getTransporter() {
    const host = process.env.SMTP_HOST || "smtp.gmail.com";
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

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
   * Send 6-digit OTP Verification Email to Gmail address
   */
  static async sendOtpEmail(email: string, code: string): Promise<boolean> {
    const transporter = this.getTransporter();

    if (!transporter) {
      logger.info(`[SMTP TEST MODE] Gmail OTP code for ${email}: ${code}`);
      return false; // Transporter not configured, fallback active
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || `"GPT-5.4 AI Chatbot" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `${code} is your Gmail Verification Code for GPT-5.4 AI Chatbot`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 12px;">
            <h2 style="color: #10A37F; text-align: center;">GPT-5.4 AI Chatbot</h2>
            <p style="font-size: 14px; color: #555;">Hello,</p>
            <p style="font-size: 14px; color: #555;">Use the 6-digit OTP verification code below to complete your Gmail verification and sign in:</p>
            <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #111827;">${code}</span>
            </div>
            <p style="font-size: 12px; color: #888; text-align: center;">This verification code will expire in 10 minutes.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Gmail OTP email successfully sent to ${email}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send Gmail OTP email to ${email}:`, error);
      return false;
    }
  }
}
