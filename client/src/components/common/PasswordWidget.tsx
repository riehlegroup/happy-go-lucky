import React from "react";
import Input from "./Input";

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
      return { label: "Very Weak", colorClass: "text-destructive" };
    case 2:
      return { label: "Weak", colorClass: "text-orange-600 dark:text-orange-400" };
    case 3:
      return { label: "Medium", colorClass: "text-yellow-600 dark:text-yellow-400" };
    case 4:
      return { label: "Strong", colorClass: "text-green-600 dark:text-green-400" };
    case 5:
      return { label: "Very Strong", colorClass: "text-green-700 dark:text-green-300" };
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
        placeholder="Please enter your password"
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      {action === "Registration" && password !== "" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-foreground">Password Strength:</span>
          <strong className={colorClass}>{label}</strong>
        </div>
      )}
    </div>
  );
};

export default PasswordWidget;
