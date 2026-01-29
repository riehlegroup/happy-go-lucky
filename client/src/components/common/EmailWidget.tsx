import React, { useState } from "react";
import { isValidEmail } from "@/utils/emailValidation";
import Input from "./Input";

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
                setSuccessMessage("E-Mail address is valid for registration!");
            } else if (action === "Login") {
                setSuccessMessage("E-Mail address valid for login!");
            }
        } else {
            setError("Invalid email address.");
        }
    };

    return (
        <div className="space-y-2">
            <Input
                type="email"
                placeholder="Please enter your email address"
                value={email}
                onChange={validateEmailInput}
            />
            {error && (
                <p className="text-sm font-semibold text-destructive">
                    {error}
                </p>
            )}
            {successMessage && (
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {successMessage}
                </p>
            )}
        </div>
    );
}

export default EmailWidget;
