/**
 * Interface for email sending services.
 * Provides abstraction over email delivery mechanism.
 */
export interface EmailService {
  /**
   * Sends an email to one or more recipients.
   *
   * @param to - Recipient email address(es), comma-separated for multiple recipients
   * @param subject - Email subject line
   * @param text - Plain text email body
   * @returns Promise that resolves when email is sent (or logged in development)
   * @throws Error if email sending fails
   */
  sendEmail(to: string, subject: string, text: string): Promise<void>;
}
