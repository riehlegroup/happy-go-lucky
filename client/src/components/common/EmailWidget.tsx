import React, {useState} from "react";
import { isValidEmail } from "@/utils/emailValidation";
import Input from "./Input";
import { msgKey, translate } from "@/Resources/i18n";

interface EmailWidgetProps {
    onEmailChange: (email: string) => void;
    action: "registration" | "login";
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
            if (action === "registration") {
                setSuccessMessage(translate(msgKey.widgets.email.validForRegistration));
            } else if (action === "login") {
                setSuccessMessage(translate(msgKey.widgets.email.validForLogin));
            }
        } else {
            setError(translate(msgKey.widgets.email.invalid));
        }
    };

    return (
        <div className="space-y-2">
            <Input
                type="email"
                placeholder={translate(msgKey.auth.placeholders.email)}
                value={email}
                onChange={validateEmailInput}
            />
            {error && (
                <p className="text-sm font-semibold text-red-600">
                    {error}
                </p>
            )}
            {successMessage && (
                <p className="text-sm font-semibold text-green-600">
                    {successMessage}
                </p>
            )}
        </div>
    );
}

export default EmailWidget;
