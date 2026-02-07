import nodemailer from "nodemailer";
import { EmailService } from "./EmailService";

/**
 * Production email service that uses local Mail Transfer Agent (sendmail/postfix).
 */
export class LocalMtaEmailService implements EmailService {
  private senderName: string;
  private senderAddress: string;

  constructor(senderName: string, senderAddress: string) {
    this.senderName = senderName;
    this.senderAddress = senderAddress;
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix'
    });

    const mailOptions = {
      from: `"${this.senderName}" <${this.senderAddress}>`,
      to,
      subject,
      text,
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent via local MTA: %s", info.messageId);
    } catch (error) {
      console.error("Error sending email via local MTA:", error);
      throw new Error("There was an error sending the email via local MTA");
    }
  }
}
