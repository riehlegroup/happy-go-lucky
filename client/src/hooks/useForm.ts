import { useState, useCallback, useEffect } from "react";
import { parseTermName } from "@/valueTypes/TermName";

type ValidationResult = string | boolean;

// Form field values can temporarily be null/undefined while the user is typing
// or while the form is initializing.
type FieldValue = string | boolean | number | null | undefined;

type ValidationRule = {
  validate: (value: FieldValue) => ValidationResult;
};

type ValidationSchema<T> = {
  [K in keyof T]?: ValidationRule[];
};

type FormErrors<T> = {
  [K in keyof T]: string;
};

// Predefined validation rules
const rules = {
  required: (fieldName: string): ValidationRule => ({
    // Only enforces presence; does not enforce type beyond string trimming.
    // - For strings: empty/whitespace-only is considered missing.
    // - For numbers/booleans: 0/false are valid values (not missing).
    validate: (value: FieldValue) => {
      if (value === null || value === undefined) return `${fieldName} is required`;
      if (typeof value === "string" && !value.trim()) return `${fieldName} is required`;
      return "";
    },
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    // Pattern validation is intentionally skipped for empty values (null/undefined/empty-string).
    // Combine with `required()` if the field must be non-empty.
    validate: (value: FieldValue) => {
      if (value === null || value === undefined) return "";
      if (typeof value !== "string") return message;

      const trimmed = value.trim();
      if (!trimmed) return "";

      return pattern.test(trimmed) ? "" : message;
    },
  }),

  boolean: (fieldName: string): ValidationRule => ({
    validate: (value) =>
      typeof value !== "boolean" ? `${fieldName} must be a boolean` : "",
  }),
};

export const createCourseValidation = () => ({
  termId: [
    {
      validate: (value: FieldValue) =>
        !value || value === 0 ? "Term is required" : "",
    },
  ],
  courseName: [
    rules.required("Course Name"),
    rules.pattern(
      /^[a-zA-Z0-9\s-]+$/,
      "Course name can only contain letters, numbers, spaces, and hyphens"
    ),
  ],
  studentsCanCreateProject: [rules.boolean("studentsCanCreateProject")],
});

export const createProjectValidation = () => ({
  projectName: [
    rules.required("projectName"),
    rules.pattern(
      /^[a-zA-Z0-9\s-]+$/,
      "Only letters, numbers, spaces and hyphens allowed"
    ),
  ],
});

export const createTermValidation = () => ({
  termName: [
    rules.required("Term Name"),
    // Keep term validation consistent with the canonical TermName parsing rules.
    // This also enforces logical year ranges (e.g. rejects "WS2025/24").
    {
      validate: (value: FieldValue) => {
        if (value === null || value === undefined) return "";
        if (typeof value !== "string") {
          return "Use format: WS24, SS25, WS24/25, Winter 2024 or Summer 2025";
        }

        if (!value.trim()) return "";
        const parsed = parseTermName(value);
        return parsed.ok ? "" : parsed.error;
      },
    },
  ],
  displayName: [
    rules.required("Display Name"),
    rules.pattern(
      /^[a-zA-Z0-9\s-\/]+$/,
      "Display name can only contain letters, numbers, spaces, hyphens, and slashes"
    ),
  ],
});

export const createCourseToTermValidation = () => ({
  courseName: [
    rules.required("Course Name"),
    rules.pattern(
      /^[a-zA-Z0-9\s-]+$/,
      "Course name can only contain letters, numbers, spaces, and hyphens"
    ),
  ],
});

export const useForm = <T extends object>(
  initialValues: T,
  validationSchema: ValidationSchema<T>
) => {
  const [data, setData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({} as FormErrors<T>);
  const [init, setInit] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, value: FieldValue): string => {
      const fieldRules = validationSchema[field];
      if (!fieldRules) return "";

      for (const rule of fieldRules) {
        const error = rule.validate(value);
        if (error) return error as string;
      }

      return "";
    },
    [validationSchema]
  );

  const handleChanges = useCallback(
    (field: keyof T, value: FieldValue) => {
      setData((prevData) => ({ ...prevData, [field]: value }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: validateField(field, value),
      }));
    },
    [validateField]
  );

  // Run initial validation on mount
  useEffect(() => {
    if (init) return;
    setErrors(
      Object.fromEntries(
        Object.entries(initialValues).map(([field, value]) => [
          field,
          validateField(field as keyof T, value),
        ])
      ) as FormErrors<T>
    );
    setInit(true);
  }, [init, initialValues, validateField]);

  // Check if Object-form is validity
  const isValid = Object.values(errors).every((error) => !error);

  return {
    data,
    errors,
    isValid,
    handleChanges,
  };
};
