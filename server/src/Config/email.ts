/**
 * Email configuration settings.
 * Values can be overridden by environment variables.
 */

export const EMAIL_CONFIG = {
  sender: {
    name: process.env.EMAIL_FROM_NAME || "Happy Go Lucky",
    address: process.env.EMAIL_FROM_ADDRESS || "dirk.riehle@fau.de"
  },
  smtp: {
    host: process.env.EMAIL_SMTP_HOST || "smtp-auth.fau.de",
    port: parseInt(process.env.EMAIL_SMTP_PORT || "465", 10),
    secure: process.env.EMAIL_SMTP_SECURE
      ? process.env.EMAIL_SMTP_SECURE.toLowerCase() === "true"
      : true
  }
};
