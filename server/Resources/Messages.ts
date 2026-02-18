export const Messages = {
  common: {
    serverError: "Server error",
  },

  auth: {
    missingRegisterFields: "Please fill in username, email and password!",
    passwordTooWeak: "Password must be at least 8 characters long and should contain upper and lower case letters as well as numbers or special characters",
    invalidEmailFormat: "Invalid email format",
    invalidEmailAddress: "Invalid email address",
    nameTooShort: "Name must be at least 3 characters long",
    registerSuccess: "User registered successfully",
    missingLoginFields: "Email and password are required",
    invalidEmail: "Invalid email",
    noPasswordSet: "No password set for user",
    invalidPassword: "Invalid password",
    emailNotConfirmed: "Email not confirmed. Please contact system admin.",
    accountSuspended: "User account is suspended. Please contact system admin.",
    accountRemoved: "User account is removed. Please contact system admin.",
    loginFailed: "Login failed",
    userEmailRequired: "User email is required",
    emailNotFound: "Email not found",
    passwordResetEmailSent: "Password reset email sent",
    tokenAndNewPasswordRequired: "Token and new password are required",
    invalidOrExpiredResetToken: "Invalid or expired reset token",
    invalidOrExpiredToken: "Invalid or expired token",
    passwordResetSuccess: "Password has been reset",
    tokenRequired: "Token is required",
    invalidOrExpiredConfirmationToken: "Invalid or expired confirmation token",
    emailConfirmed: "Email has been confirmed",
    userNotFound: "User not found",
    userNotFoundOrNotUnconfirmed: "User not found or not unconfirmed",
    confirmationEmailSent: "Confirmation email sent",
    failedToSendConfirmationEmail: "Failed to send confirmation email",
  },

  email: {
    confirmEmailSubject: "Confirm Email",
    confirmEmailBody: (confirmedLink: string) =>
      `You registered for Happy Go Lucky! Click the link to confirm your email: ${confirmedLink}`,

    passwordResetSubject: "Password Reset",
    passwordResetBody: (resetLink: string) =>
      `You requested a password reset. Click the link to reset your password: ${resetLink}`,
  },
};
