import { useEffect } from "react";
import type { Term } from "@/components/Administration/Term/types";
import type { Course } from "@/components/Administration/Course/types";
import {
  useForm,
  createTermValidation,
  createCourseToTermValidation,
} from "@/hooks/useForm";
import Button from "@/components/common/Button";
import { Message } from "./TermMessage";
import { cn } from "@/lib/utils";
import { msgKey, translate } from "@/Resources/i18n";

interface FormFieldProps {
  label: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  value,
  onChange,
  error,
}: FormFieldProps) => (
  <div className="flex-col items-center justify-between">
    <h4>{label}: </h4>
    <input
      className={cn(
        "h-10 w-full bg-gray-50 text-black",
        error && "border-red-500 ring-1 ring-red-500"
      )}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <div className="text-sm text-red-500">{error}</div>}
  </div>
);

interface TermFormProps {
  type: "term" | "course";
  label: string[];
  data: Term | Course | undefined;
  message: Message | undefined;
  submitText?: string;
  onChange: (data: Term | Course) => void;
  onSubmit: () => Promise<void>;
  children?: React.ReactNode;
}

export const TermForm: React.FC<TermFormProps> = ({
  type,
  label,
  data,
  message,
  onChange,
  onSubmit,
  submitText,
  children,
}: TermFormProps) => {
  const isTerm = type === "term";

  // Use the correct type & validation schema based on form type
  const {
    data: formData,
    errors,
    isValid,
    handleChanges,
  } = isTerm
    ? useForm<Term>(data as Term, createTermValidation())
    : useForm<Course>(data as Course, createCourseToTermValidation());

  // Notify parent of changes
  useEffect(() => {
    onChange(formData);
  }, [formData]);

  // Narrow the handleChanges using type assertions
  const termHandleChanges = handleChanges as (
    key: keyof Term,
    value: string
  ) => void;
  const courseHandleChanges = handleChanges as (
    key: keyof Course,
    value: string
  ) => void;

  const handleSubmit = async () => {
    await onSubmit();
  };

  const getButtonStyles = (isValid: boolean, message?: Message): string => {
    return cn(
      "w-fit rounded px-3 py-1 transition-all duration-300 bg-blue-500 text-white hover:bg-blue-600",
      {
        // Disabled
        "bg-gray-400 text-gray-200 cursor-not-allowed": !isValid,
        // Success
        "bg-green-500": isValid && message?.type === "success",
        // Error
        "bg-red-500": isValid && message?.type === "error",
      }
    );
  };

  return (
    <div className="space-y-4">
      {isTerm ? (
        <>
          <FormField
            label={label[0]}
            value={(formData as Term).termName || ""}
            error={(errors as Record<keyof Term, string>).termName}
            onChange={(value) => termHandleChanges("termName", value)}
          />
          <FormField
            label={label[1]}
            value={(formData as Term).displayName || ""}
            error={(errors as Record<keyof Term, string>).displayName}
            onChange={(value) => termHandleChanges("displayName", value)}
          />
        </>
      ) : (
        <FormField
          label={label[0]}
          value={(formData as Course).courseName || ""}
          error={(errors as Record<keyof Course, string>).courseName}
          onChange={(value) => courseHandleChanges("courseName", value)}
        />
      )}
      {children}
      <div className="mt-2 flex flex-col items-end">
        <Button
          disabled={!isValid}
          className={getButtonStyles(isValid, message)}
          onClick={handleSubmit}
        >
          {(submitText ?? translate(msgKey.common.actions.submit)).toUpperCase()}
        </Button>
      </div>
    </div>
  );
};
