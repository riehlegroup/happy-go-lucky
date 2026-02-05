import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import authApi from "@/services/api/auth";
import MessageBanner from "@/components/common/MessageBanner";
import "./AuthScreens.css";

const useQuery = () => {
  return new URLSearchParams(useLocation().search); // search: '?query=string'
};

const ResetPassword = () => {
  const query = useQuery();
  const token = query.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    console.log("Token from URL:", token);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!token) {
      setMessage({ text: "Invalid or missing reset token", type: "error" });
      return;
    }

    try {
      await authApi.resetPassword(token, newPassword);
      setMessage({ text: "Password has been reset successfully!", type: "success" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMessage({ text: error.message, type: "error" });
      } else {
        setMessage({ text: "An unexpected error occurred", type: "error" });
      }
    }
  };

  return (
    <div className="container">
      <div className="header">
        <div className="text">Reset Your Password</div>
        <br />
        <div className="underline"></div>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="inputs">
          <div className="input">
            <input
              className="inputBox"
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
        </div>
        <div className="submit-container">
          <button type="submit" className="submit-ResetPassword">
            Reset Password
          </button>
        </div>
      </form>
      {message && <MessageBanner message={message} className="mt-4" />}
    </div>
  );
};

export default ResetPassword;
