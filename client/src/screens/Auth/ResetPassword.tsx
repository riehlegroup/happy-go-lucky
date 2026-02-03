import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import authApi from "@/services/api/auth";
import "./AuthScreens.css";
import { msgKey, translate } from "@/Resources/i18n";

const useQuery = () => {
  return new URLSearchParams(useLocation().search); // search: '?query=string'
};

const ResetPassword = () => {
  const query = useQuery();
  const token = query.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log("Token from URL:", token);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setMessage(translate(msgKey.auth.messages.invalidOrMissingResetToken));
      return;
    }

    try {
      await authApi.resetPassword(token, newPassword);
      setMessage(translate(msgKey.auth.messages.passwordResetSuccess));
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage(error.message);
      } else {
        setMessage(translate(msgKey.common.errors.unexpected));
      }
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">{translate(msgKey.auth.headings.resetPassword)}</div>
        <br />
        <div className="underline"></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="inputs">
          <div className="input">
            <input
              className="inputBox"
              type="password"
              placeholder={translate(msgKey.auth.placeholders.newPassword)}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="submit-container">
          <button type="submit" className="submit-ResetPassword">
            {translate(msgKey.auth.actions.resetPassword)}
          </button>
        </div>
      </form>
      {message && <div className="message">{message}</div>}
    </div>
  );
};

export default ResetPassword;
