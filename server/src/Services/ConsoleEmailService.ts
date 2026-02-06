import { EmailService } from "./EmailService";

/**
 * Development email service that logs emails to console instead of sending them.
 * Used in non-production environments to avoid sending real emails during development/testing.
 */
export class ConsoleEmailService implements EmailService {
  private senderName: string;
  private senderAddress: string;

  constructor(senderName: string, senderAddress: string) {
    this.senderName = senderName;
    this.senderAddress = senderAddress;
  }

  async sendEmail(to: string, subject: string, text: string): Promise<void> {
    const mailOptions = {
      from: `"${this.senderName}" <${this.senderAddress}>`,
      to,
      subject,
      text,
    };

    console.log("Email would have been sent with the following options:");
    console.log(JSON.stringify(mailOptions, null, 2));
  }
}
