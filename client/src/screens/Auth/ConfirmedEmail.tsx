import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import authApi from "@/services/api/auth";
import { msgKey, translate } from "@/Resources/i18n";

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
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();

    if (!token) {
      setMessage(translate(msgKey.auth.messages.invalidOrMissingConfirmationToken));
      return;
    }

    try {
      await authApi.confirmEmail(token);
      setMessage(translate(msgKey.auth.messages.emailConfirmedSuccess));
      setTimeout(() => navigate("/login"), 2000);
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
        <div className="COnfirmEMailheader">
          <div className="text">{translate(msgKey.auth.headings.confirmEmail)}</div>
          <br />
          <div className="underline"></div>
        </div>
        <div className="text ConfirmEmailText">
          {translate(msgKey.auth.helperText.confirmEmail.line1)}
          <br /> {translate(msgKey.auth.helperText.confirmEmail.line2)}
        </div>
        <div className="ConfirmEmailsubmit-container">
          <button type="submit" className="submit" onClick={handleSubmit}>
            {translate(msgKey.auth.actions.confirm)}
          </button>
        </div>

        {message && <div className="message">{message}</div>}
      </div>
    </>
  );
};

export default ConfirmedEmail;
