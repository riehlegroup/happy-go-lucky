import React from "react";
import PasswordInput from "./PasswordInput";

const containsLowerAndUpperCase = (value: string): boolean =>
  /(?=.*[a-z])(?=.*[A-Z])/.test(value);
const containsNumber = (value: string): boolean => /\d/.test(value);
const containsSpecialCharacter = (value: string): boolean =>
  /[!@#$%^&*(),.?":{}|<>]/.test(value);

const calculatePasswordStrength = (value: string): number => {
  if (value.length < 8) return 1;

  let strength = 1;
  if (containsLowerAndUpperCase(value)) strength++;
  if (containsNumber(value)) strength++;
  if (containsSpecialCharacter(value)) strength++;
  if (value.length >= 12) strength++;
  return strength;
};

const getStrengthInfo = (strength: number) => {
  switch (strength) {
    case 1:
      return { label: "Very Weak", colorClass: "text-red-700" };
    case 2:
      return { label: "Weak", colorClass: "text-orange-600" };
    case 3:
      return { label: "Medium", colorClass: "text-yellow-600" };
    case 4:
      return { label: "Strong", colorClass: "text-green-600" };
    case 5:
      return { label: "Very Strong", colorClass: "text-green-700" };
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
      <PasswordInput
        placeholder="Please enter your password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />

      {action === "Registration" && password !== "" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-700">Password Strength:</span>
          <strong className={colorClass}>{label}</strong>
        </div>
      )}
    </div>
  );
};

export default PasswordWidget;
