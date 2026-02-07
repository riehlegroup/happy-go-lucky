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
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;

    // If the user typed something invalid, keep their text instead of
    // snapping to empty because the parsed value is currently null.
    if (touched && text.trim() && value === null) return;

    setText(value ?? "");
  }, [value, isFocused, touched, text]);

  const parsed = useMemo(() => parseTermName(text), [text]);

  const error = useMemo(() => {
    if (!touched) return "";
    if (!text.trim()) return "Term name is required";
    if (!parsed.ok) return parsed.error;
    return "";
  }, [touched, text, parsed]);

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
        onFocus={() => setIsFocused(true)}
        onChange={(e) => {
          const next = e.target.value;
          setTouched(true);
          setText(next);

          if (!next.trim()) {
            onChange(null);
            return;
          }

          // While typing, allow intermediate invalid states (e.g. "WS2024/")
          // without clearing the input. We still report null upstream so the
          // form cannot be submitted until it's valid.
          const result = parseTermName(next);
          onChange(result.ok ? result.value : null);
        }}
        onBlur={() => {
          setTouched(true);
          setIsFocused(false);

          // On blur, we stop allowing intermediate invalid states and either:
          // - canonicalize (if valid), or
          // - report null upstream (if invalid/empty)
          const result = parseTermName(text);
          if (result.ok) {
            // Canonicalize display on blur (but not during typing)
            setText(result.value);
            onChange(result.value);
          } else {
            onChange(null);
          }
        }}
      />
      {error && <div className="text-sm text-red-500">{error}</div>}
    </div>
  );
};
