import React, { useState } from "react";
import "./AuthScreens.css";
import EmailIcon from "./../../assets/EmailIcon.png";
import authApi from "@/services/api/auth";
import { msgKey, translate } from "@/Resources/i18n";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await authApi.forgotPassword(email);
      setMessage(translate(msgKey.auth.messages.passwordResetLinkSent));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(translate(msgKey.common.errors.unexpected));
      }
    }
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <div className="text">{translate(msgKey.auth.headings.forgotPassword)}</div>
          <br />
          <div className="underline"></div>
        </div>
        <div className="text ForgotPasswordText">
          {translate(msgKey.auth.helperText.forgotPassword.line1)}
          <br /> {translate(msgKey.auth.helperText.forgotPassword.line2)}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="inputs">
            <div className="input">
              <img className="email-icon" src={EmailIcon} alt="" />
              <input
                className="inputBox"
                type="email"
                placeholder={translate(msgKey.auth.placeholders.email)}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="submit-container">
            <button type="submit" className="submit">
              {translate(msgKey.auth.actions.send)}
            </button>
          </div>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </>
  );
};

export default ForgotPassword;
