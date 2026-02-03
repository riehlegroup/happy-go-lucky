import React from "react";
import Input from "./Input";
import { msgKey, translate } from "@/Resources/i18n";

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
      return { labelKey: msgKey.widgets.password.strengths.veryWeak, colorClass: "text-red-700" };
    case 2:
      return { labelKey: msgKey.widgets.password.strengths.weak, colorClass: "text-orange-600" };
    case 3:
      return { labelKey: msgKey.widgets.password.strengths.medium, colorClass: "text-yellow-600" };
    case 4:
      return { labelKey: msgKey.widgets.password.strengths.strong, colorClass: "text-green-600" };
    case 5:
      return { labelKey: msgKey.widgets.password.strengths.veryStrong, colorClass: "text-green-700" };
    default:
      return { labelKey: msgKey.widgets.password.strengths.veryWeak, colorClass: "" };
  }
};

interface PasswordWidgetProps {
  password: string;
  onPasswordChange: (password: string) => void;
  action: "registration" | "login";
}

const PasswordWidget: React.FC<PasswordWidgetProps> = ({
  password,
  onPasswordChange,
  action,
}) => {
  const strength = calculatePasswordStrength(password);
  const { labelKey, colorClass } = getStrengthInfo(strength);
  const label = translate(labelKey);

  return (
    <div className="space-y-2">
      <Input
        type="password"
        placeholder={translate(msgKey.auth.placeholders.password)}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
      />
      {action === "registration" && password !== "" && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-700">{translate(msgKey.widgets.password.strengthLabel)}</span>
          <strong className={colorClass}>{label}</strong>
        </div>
      )}
    </div>
  );
};

export default PasswordWidget;
