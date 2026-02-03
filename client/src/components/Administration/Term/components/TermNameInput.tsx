import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { TermName, parseTermName } from "@/valueTypes/TermName";

interface TermNameInputProps {
  label: string;
  value: TermName | null;
  onChange: (value: TermName | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const TermNameInput: React.FC<TermNameInputProps> = ({
  label,
  value,
  onChange,
  placeholder = "e.g. WS24, WS2024/25, Winter 2024",
  disabled = false,
}) => {
  const [text, setText] = useState<string>(value ?? "");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    setText(value ?? "");
  }, [value]);

  const parsed = useMemo(() => {
    if (!text.trim()) return { ok: false as const, error: "" };
    return parseTermName(text);
  }, [text]);

  const error = touched && text.trim() && !parsed.ok ? parsed.error : "";

  return (
    <div className="flex-col items-center justify-between">
      <h4>{label}: </h4>
      <input
        className={cn(
          "h-10 w-full bg-gray-50 text-black",
          error && "border-red-500 ring-1 ring-red-500"
        )}
        type="text"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const next = e.target.value;
          setTouched(true);
          setText(next);

          if (!next.trim()) {
            onChange(null);
            return;
          }

          const result = parseTermName(next);
          onChange(result.ok ? result.value : null);
        }}
        onBlur={() => {
          setTouched(true);
          const result = parseTermName(text);
          if (result.ok) setText(result.value);
        }}
      />
      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
};
