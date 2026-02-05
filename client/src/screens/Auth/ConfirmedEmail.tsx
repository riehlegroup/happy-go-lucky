import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authApi from "@/services/api/auth";
import MessageBanner from "@/components/common/MessageBanner";

const useQuery = () => {
  return new URLSearchParams(useLocation().search); // search: '?query=string'
};

const ConfirmedEmail = () => {
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get("token");

  useEffect(() => {
    console.log("Token from URL:", token);
  }, [token]);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();

    if (!token) {
      setMessage({ text: "Invalid or missing confirmation token", type: "error" });
      return;
    }

    try {
      await authApi.confirmEmail(token);
      setMessage({ text: "Email has been confirmed successfully!", type: "success" });
      setTimeout(() => navigate("/login"), 2000);
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
        <div className="COnfirmEMailheader">
          <div className="text">Confirm Email</div>
          <br />
          <div className="underline"></div>
        </div>
        <div className="text ConfirmEmailText">
          Thank you for confirming your email!
          <br /> Please click the button to confirm and go back to Login Page
        </div>
        <div className="ConfirmEmailsubmit-container">
          <button type="submit" className="submit" onClick={handleSubmit}>
            Confirm
          </button>
        </div>

        {message && <MessageBanner message={message} className="mt-4" />}
      </div>
    </>
  );
};

export default ConfirmedEmail;
