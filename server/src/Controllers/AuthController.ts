import { Application, Request, Response } from "express";
import { Database } from "sqlite";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
import { UserStatus, UserStatusEnum } from "../Utils/UserStatus";
import { ObjectHandler } from "../ObjectHandler";
import { comparePassword, hashPassword } from "../Utils/hash";
import { Password } from "../Models/Password";
import { DatabaseSerializableFactory } from "../Serializer/DatabaseSerializableFactory";
import { DatabaseWriter } from "../Serializer/DatabaseWriter";
import { DatabaseResultSetReader } from "../Serializer/DatabaseResultSetReader";
import { User } from "../Models/User";
import { Email } from "../ValueTypes/Email";
import { IAppController } from "./IAppController";
import { IEmailService } from "../Services/IEmailService";
import { II18nService, msgKey } from "../Services/I18nService";

dotenv.config();

/**
 * Controller for handling authentication-related HTTP requests.
 * Manages user registration, login, password reset, and email confirmation.
 */
export class AuthController implements IAppController {
  constructor(
    private db: Database,
    private emailService: IEmailService,
    private i18n: II18nService
  ) {}

  /**
   * Initializes API routes for authentication.
   * @param app Express application instance
   */
  init(app: Application): void {
    app.post("/user", this.register.bind(this));
    app.post("/session", this.login.bind(this));
    app.post("/user/password/forgotMail", this.forgotPassword.bind(this));
    app.post("/user/password/reset", this.resetPassword.bind(this));
    app.post("/user/confirmation/email", this.confirmEmail.bind(this));
    app.post("/user/confirmation/trigger", this.sendConfirmationEmail.bind(this));
  }

  async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
    const passwordObj = Password.create(password);

    if (!name || !email || !passwordObj) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.auth.fillInUsernameEmailPassword) });
      return;
    }

    if (passwordObj.getStrength() < 3) {
      res.status(400).json({
        message: this.i18n.translate(req, msgKey.auth.passwordStrengthRequirements),
      });
      return;
    }

    if (typeof email !== "string") {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.auth.emailWrongFormat) });
      return;
    }

    if (name.length < 3) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.auth.nameMinLength3) });
      return;
    }

    let validatedEmail: Email;
    try {
      validatedEmail = new Email(email as string);
    } catch {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    const hashedPassword = await hashPassword(passwordObj.toString());

    try {
      const writer = new DatabaseWriter(this.db);
      const dbsf = new DatabaseSerializableFactory(this.db);
      const oh = new ObjectHandler();

      const u = (await dbsf.create("User")) as User;
      u.setName(name);
      u.setEmail(new Email(email));
      u.setPassword(hashedPassword);
      await writer.writeRoot(u);
      res.status(201).json({ message: this.i18n.translate(req, msgKey.auth.userRegisteredSuccessfully) });

      // Generate confirm email TOKEN
      const registeredUser = await oh.getUserByMail(email, this.db);
      if (!registeredUser) {
        console.error("Email not found after registration");
        return;
      }

      const token = crypto.randomBytes(20).toString("hex");
      const expire = Date.now() + 3600000; // 1 hour

      console.log(`Generated token: ${token}, Expiry time: ${expire}`);

      u.setConfirmEmailToken(token);
      u.setConfirmEmailExpire(expire);
      await writer.writeRoot(u);

      await this.sendConfirmEmail(validatedEmail, token);

      console.log("Confirmation email sent");
    } catch (error) {
      console.error("Error during user registration:", error);
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const passwordObj = Password.create(password);
    if (!email || !passwordObj || typeof email !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.auth.emailAndPasswordRequired) });
      return;
    }

    try {
      new Email(email as string);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    try {
      const oh = new ObjectHandler();
      const user = await oh.getUserByMail(email, this.db);
      if (!user) {
        res.status(400).json({ message: this.i18n.translate(req, msgKey.auth.invalidEmail) });
        return;
      }

      const userPassword = user.getPassword();
      if (userPassword === null) {
        res
          .status(400)
          .json({ message: this.i18n.translate(req, msgKey.auth.noPasswordSetForUser) });
        return;
      } else {
        const isValidPassword = await comparePassword(
          passwordObj.toString(),
          userPassword
        );
        if (!isValidPassword) {
          res
            .status(400)
            .json({ message: this.i18n.translate(req, msgKey.auth.invalidPassword) });
          return;
        }
      }

      let st: string = user.getStatus();
      let userStatus: UserStatus = new UserStatus(st as UserStatusEnum);
      if (userStatus.getStatus() == UserStatusEnum.unconfirmed) {
        res
          .status(400)
          .json({
            message: this.i18n.translate(req, msgKey.auth.emailNotConfirmedContactAdmin),
          });
        return;
      } else if (userStatus.getStatus() == UserStatusEnum.suspended) {
        res.status(400).json({
          message: this.i18n.translate(req, msgKey.auth.userSuspendedContactAdmin),
        });
        return;
      } else if (userStatus.getStatus() == UserStatusEnum.removed) {
        res.status(400).json({
          message: this.i18n.translate(req, msgKey.auth.userRemovedContactAdmin),
        });
        return;
      }

      const token = jwt.sign({ id: user.getId() }, process.env.JWT_SECRET || "your_jwt_secret", {
        expiresIn: "1h",
      });
      res.status(200).json({
        token,
        name: user.getName(),
        email: user.getEmailString(),
        githubUsername: user.getGithubUsername(),
      });
    } catch (error) {
      console.error("Error during login:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.auth.loginFailed) });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    let email: Email;
    if (!req.body.email || typeof req.body.email !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.auth.userEmailIsRequired) });
      return;
    }
    try {
      email = new Email(req.body.email as string);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }

    try {
      const oh = new ObjectHandler();
      const writer = new DatabaseWriter(this.db);
      const user = await oh.getUserByMail(email.toString(), this.db);
      if (!user) {
        res.status(404).json({ message: this.i18n.translate(req, msgKey.auth.emailNotFound) });
        return;
      }

      const token = crypto.randomBytes(20).toString("hex");
      const expire = Date.now() + 3600000;

      console.log(`Generated token: ${token}, Expiry time: ${expire}`);

      user.setResetPasswordToken(token);
      user.setResetPasswordExpire(expire);
      await writer.writeRoot(user);

      await this.sendPasswordResetEmail(email, token);

      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.auth.passwordResetEmailSent) });
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.common.serverError) });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    const newPasswordObj = Password.create(newPassword);

    if (!token || !newPassword) {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.auth.tokenAndNewPasswordRequired) });
      return;
    }

    try {
      const writer = new DatabaseWriter(this.db);

      const currentTime = Date.now();
      const user = await this.db.get(
        "SELECT * FROM users WHERE resetPasswordToken = ?",
        [token]
      );

      if (!user) {
        res
          .status(401)
          .json({ message: this.i18n.translate(req, msgKey.auth.invalidOrExpiredResetToken) });
        return;
      }

      const reader = new DatabaseResultSetReader(user, this.db);
      const u = (await reader.readRoot(User)) as User;

      console.log("User retrieved from database:", user);

      if (
        !u ||
        u.getResetPasswordExpire() === null ||
        (u.getResetPasswordExpire() as number) < currentTime
      ) {
        res
          .status(400)
          .json({ message: this.i18n.translate(req, msgKey.auth.invalidOrExpiredToken) });
        return;
      } else if (newPasswordObj.getStrength() < 3) {
        res.status(400).json({
          message: this.i18n.translate(req, msgKey.auth.passwordStrengthRequirements),
        });
        return;
      }

      const hashedPassword = await hashPassword(newPasswordObj.toString());
      u.setPassword(hashedPassword);
      u.setResetPasswordExpire(null);
      u.setResetPasswordToken(null);
      await writer.writeRoot(u);

      res.status(200).json({ message: this.i18n.translate(req, msgKey.auth.passwordHasBeenReset) });
    } catch (error) {
      console.error("Error in resetPassword:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.common.serverError) });
    }
  }

  async confirmEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: this.i18n.translate(req, msgKey.auth.tokenIsRequired) });
      return;
    }

    console.log("Token:", token);

    try {
      const writer = new DatabaseWriter(this.db);
      const currentTime = Date.now();
      const user = await this.db.get(
        "SELECT * FROM users WHERE confirmEmailToken = ?",
        [token]
      );

      if (!user) {
        res
          .status(401)
          .json({
            message: this.i18n.translate(req, msgKey.auth.invalidOrExpiredConfirmationToken),
          });
        return;
      }

      const reader = new DatabaseResultSetReader(user, this.db);
      const u = (await reader.readRoot(User)) as User;

      console.log("User retrieved from database:", user);

      if (user.confirmEmailExpire < currentTime) {
        res
          .status(400)
          .json({ message: this.i18n.translate(req, msgKey.auth.invalidOrExpiredToken) });
        return;
      }

      await this.db.run(
        'UPDATE users SET status = "confirmed", confirmEmailToken = NULL, confirmEmailExpire = NULL WHERE email = ?',
        [user.email.toString()]
      );
      u.setStatus("confirmed");
      u.setConfirmEmailToken(null);
      u.setConfirmEmailExpire(null);
      await writer.writeRoot(u);

      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.auth.emailHasBeenConfirmed) });
    } catch (error) {
      console.error("Error in confirmEmail:", error);
      res.status(500).json({ message: this.i18n.translate(req, msgKey.common.serverError) });
    }
  }

  async sendConfirmationEmail(req: Request, res: Response): Promise<void> {
    let email: Email;
    if (!req.body.email || typeof req.body.email !== "string") {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.auth.userEmailIsRequired) });
      return;
    }
    try {
      email = new Email(req.body.email as string);
    } catch {
      res
        .status(400)
        .json({ message: this.i18n.translate(req, msgKey.common.invalidEmailAddress) });
      return;
    }
    try {
      const oh = new ObjectHandler();
      const writer = new DatabaseWriter(this.db);
      const user = await oh.getUserByMail(email.toString(), this.db);
      if (!user) {
        res.status(400).json({ message: this.i18n.translate(req, msgKey.common.userNotFound) });
        return;
      }
      let st: string = user.getStatus();
      let userStatus: UserStatus = new UserStatus(st as UserStatusEnum);
      if (userStatus.getStatus() != UserStatusEnum.unconfirmed) {
        res
          .status(400)
          .json({
            message: this.i18n.translate(req, msgKey.auth.userNotFoundOrNotUnconfirmed),
          });
        return;
      }

      const token = crypto.randomBytes(20).toString("hex");
      const expire = Date.now() + 3600000;

      user.setConfirmEmailToken(token);
      user.setConfirmEmailExpire(expire);
      await writer.writeRoot(user);
      await this.sendConfirmEmail(email, token);

      res
        .status(200)
        .json({ message: this.i18n.translate(req, msgKey.auth.confirmationEmailSent) });
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      res
        .status(500)
        .json({ message: this.i18n.translate(req, msgKey.auth.failedToSendConfirmationEmail) });
    }
  }

  private async sendConfirmEmail(email: Email, token: string): Promise<void> {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const confirmedLink = `${clientUrl}/confirmedEmail?token=${token}`;

    await this.emailService.sendEmail(
      email.toString(),
      this.i18n.translate(msgKey.auth.confirmEmailSubject),
      this.i18n.translate(msgKey.auth.confirmEmailBody, confirmedLink)
    );
  }

  private async sendPasswordResetEmail(email: Email, token: string): Promise<void> {
    const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
    const resetLink = `${clientUrl}/resetPassword?token=${token}`;

    await this.emailService.sendEmail(
      email.toString(),
      this.i18n.translate(msgKey.auth.passwordResetSubject),
      this.i18n.translate(msgKey.auth.passwordResetBody, resetLink)
    );
  }
}
