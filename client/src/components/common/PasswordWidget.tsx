import React from "react";
import Input from "./Input";
import { en as messages } from "@/messages";

const containsLowerAndUpperCase = (value: string): boolean =>
  /(?=.*[a-z])(?=.*[A-Z])/.test(value);
const containsNumber = (value: string): boolean => /\d/.test(value);
const containsSpecialCharacter = (value: string): boolean =>
  /[!@#$%^&*(),.?":{}|<>]/.test(value);

const calculatePasswordStrength = (value: string): number => {
  if (value.length < 8) {
    return 1;
  }

  let strength = 1;
  if (containsLowerAndUpperCase(value)) {
    strength++;
  }
  if (containsNumber(value)) {
    strength++;
  }
  if (containsSpecialCharacter(value)) {
    strength++;
  }
  if (value.length >= 12) {
    strength++;
  }
  return strength;
};

const getStrengthInfo = (strength: number) => {
  switch (strength) {
    case 1:
      return {
        label: messages.password.strength.veryWeak,
        colorClass: "text-red-700",
      };
    case 2:
      return {
        label: messages.password.strength.weak,
        colorClass: "text-orange-600",
      };
    case 3:
      return {
        label: messages.password.strength.medium,
        colorClass: "text-yellow-600",
      };
    case 4:
      return {
        label: messages.password.strength.strong,
        colorClass: "text-green-600",
      };
    case 5:
      return {
        label: messages.password.strength.veryStrong,
        colorClass: "text-green-700",
      };
    default:
      return { label: "", colorClass: "" };
  }
};

interface PasswordWidgetProps {
  password: string;
  onPasswordChange: (password: string) => void;
  action: string;
}

const PasswordWidget: React.FC<PasswordWidgetProps> = ({
  password,
  onPasswordChange,
  action,
}) => {
  const strength = calculatePasswordStrength(password);
  const { label, colorClass } = getStrengthInfo(strength);

  return (
    <div className="space-y-2">
      <Input
        type="password"
        placeholder={messages.password.placeholder}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      {action === "Registration" && password !== "" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-700">
            {messages.password.strength.label}
          </span>
          <strong className={colorClass}>{label}</strong>
        </div>
      )}
    </div>
  );
};

export default PasswordWidget;
