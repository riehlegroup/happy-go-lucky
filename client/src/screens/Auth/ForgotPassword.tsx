import React, { useState } from "react";
import "./AuthScreens.css";
import EmailIcon from "./../../assets/EmailIcon.png";
import authApi from "@/services/api/auth";
import { en as messages } from "@/messages";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await authApi.forgotPassword(email);
      setMessage(messages.auth.forgotPassword.status.linkSent);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(messages.errors.unexpected);
      }
    }
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <div className="text">{messages.auth.forgotPassword.title}</div>
          <br />
          <div className="underline"></div>
        </div>
        <div className="text ForgotPasswordText">
          {messages.auth.forgotPassword.description.split("\n")[0]}
          <br /> {messages.auth.forgotPassword.description.split("\n")[1]}
        </div>
        <form onSubmit={handleSubmit}>
          <div className="inputs">
            <div className="input">
              <img className="email-icon" src={EmailIcon} alt="" />
              <input
                className="inputBox"
                type="email"
                placeholder={messages.auth.forgotPassword.placeholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="submit-container">
            <button type="submit" className="submit">
              {messages.auth.forgotPassword.button}
            </button>
          </div>
        </form>
        {message && <div className="message">{message}</div>}
      </div>
    </>
  );
};

export default ForgotPassword;
