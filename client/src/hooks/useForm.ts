import { useState, useCallback, useEffect } from "react";

type ValidationResult = string | boolean;

type ValidationRule = {
  validate: (value: string | boolean | number | null) => ValidationResult;
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
    validate: (value: string | boolean | number | null) =>
      !value ? `${fieldName} is required` : "",
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value: string | boolean | number | null) =>
      typeof value === "string" && !pattern.test(value.toLowerCase())
        ? message
        : "",
  }),

  boolean: (fieldName: string): ValidationRule => ({
    validate: (value) =>
      typeof value !== "boolean" ? `${fieldName} must be a boolean` : "",
  }),
};

export const createCourseValidation = () => ({
  termId: [
    {
      validate: (value: string | boolean | number | null) =>
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
    rules.pattern(
      /^(ws|winter|ss|summer)\s*(?:(\d{2}|\d{4})(?:\/(\d{2}))?)$/,
      "Use format: WS24, SS25, WS24/25, Winter 2024 or Summer 2025"
    ),
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
    (field: keyof T, value: string | boolean | number | null): string => {
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
    (field: keyof T, value: string | boolean | number | null) => {
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
