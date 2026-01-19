import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authApi from "@/services/api/auth";
import { en as messages } from "@/messages";

const useQuery = () => {
  return new URLSearchParams(useLocation().search); // search: '?query=string'
};

const ConfirmedEmail = () => {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const query = useQuery();
  const token = query.get("token");

  useEffect(() => {
    console.log("Token from URL:", token);
  }, [token]);

  const handleSubmit = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    e.preventDefault();

    if (!token) {
      setMessage(messages.auth.confirmEmail.status.invalidToken);
      return;
    }

    try {
      await authApi.confirmEmail(token);
      setMessage(messages.auth.confirmEmail.status.success);
      setTimeout(() => navigate("/login"), 2000);
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
        <div className="COnfirmEMailheader">
          <div className="text">{messages.auth.confirmEmail.title}</div>
          <br />
          <div className="underline"></div>
        </div>
        <div className="text ConfirmEmailText">
          {messages.auth.confirmEmail.description.split("\n")[0]}
          <br /> {messages.auth.confirmEmail.description.split("\n")[1]}
        </div>
        <div className="ConfirmEmailsubmit-container">
          <button type="submit" className="submit" onClick={handleSubmit}>
            {messages.auth.confirmEmail.button}
          </button>
        </div>

        {message && <div className="message">{message}</div>}
      </div>
    </>
  );
};

export default ConfirmedEmail;
