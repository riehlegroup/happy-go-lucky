import nodemailer from "nodemailer";
import { EmailService } from "./EmailService";

/**
 * Production email service that sends real emails via SMTP.
 * Requires SMTP configuration and authentication credentials from environment variables.
 */
export class SmtpEmailService implements EmailService {
  private senderName: string;
  private senderAddress: string;
  private smtpHost: string;
  private smtpPort: number;
  private smtpSecure: boolean;

  constructor(
    senderName: string,
    senderAddress: string,
    smtpHost: string,
    smtpPort: number,
    smtpSecure: boolean
  ) {
    this.senderName = senderName;
    this.senderAddress = senderAddress;
    this.smtpHost = smtpHost;
    this.smtpPort = smtpPort;
    this.smtpSecure = smtpSecure;
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      host: this.smtpHost,
      port: this.smtpPort,
      secure: this.smtpSecure,
      auth: {
        user: process.env.EMAIL_USER_FAU,
        pass: process.env.EMAIL_PASS_FAU,
      },
    });

    const mailOptions = {
      from: `"${this.senderName}" <${this.senderAddress}>`,
      to,
      subject,
      text,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent: %s", info.messageId);
    } catch (error) {
      console.error("Error sending email:", error);
      throw new Error("There was an error sending the email");
    }
  }
}
