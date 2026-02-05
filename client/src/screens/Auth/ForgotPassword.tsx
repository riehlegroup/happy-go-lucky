import React, { useState } from "react";
import "./AuthScreens.css";
import EmailIcon from "./../../assets/EmailIcon.png";
import authApi from "@/services/api/auth";
import MessageBanner from "@/components/common/MessageBanner";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      await authApi.forgotPassword(email);
      setMessage({ text: "Password reset link sent! Please check your email.", type: "success" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unexpected error occurred", type: "error" });
      }
    }
  };

  return (
    <>
      <div className="container">
        <div className="header">
          <div className="text">Forgot Your Password</div>
          <br />
          <div className="underline"></div>
        </div>
        <div className="text ForgotPasswordText">
          Enter your email address and
          <br /> we will send you a link to reset your password
        </div>
        <form onSubmit={handleSubmit}>
          <div className="inputs">
            <div className="input">
              <img className="email-icon" src={EmailIcon} alt="" />
              <input
                className="inputBox"
                type="email"
                placeholder="Please enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="submit-container">
            <button type="submit" className="submit">
              Send
            </button>
          </div>
        </form>
        {message && <MessageBanner message={message} className="mt-4" />}
      </div>
    </>
  );
};

export default ForgotPassword;
