import React, { useState } from "react";
import { isValidEmail } from "@/utils/emailValidation";
import Input from "./Input";
import { en as messages } from "@/messages";

interface EmailWidgetProps {
  onEmailChange: (email: string) => void;
  action: "Registration" | "Login";
}

const EmailWidget: React.FC<EmailWidgetProps> = ({ onEmailChange, action }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const validateEmailInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentEmailValue = e.target.value;
    setEmail(currentEmailValue);
    onEmailChange(currentEmailValue);
    setSuccessMessage(null);

    if (isValidEmail(currentEmailValue)) {
      setError("");
      if (action === "Registration") {
        setSuccessMessage(messages.email.registrationValid);
      } else if (action === "Login") {
        setSuccessMessage(messages.email.loginValid);
      }
    } else {
      setError(messages.email.invalidWithPeriod);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="email"
        placeholder={messages.email.placeholder}
        value={email}
        onChange={validateEmailInput}
      />
      {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
      {successMessage && (
        <p className="text-sm font-semibold text-green-600">{successMessage}</p>
      )}
    </div>
  );
};

export default EmailWidget;
