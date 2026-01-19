import { useState, useCallback, useEffect } from "react";
import { en as messages } from "@/messages";

type ValidationResult = string | boolean;

type ValidationRule = {
  validate: (value: string | boolean | number) => ValidationResult;
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
    validate: (value: string | boolean | number) =>
      !value ? messages.validation.required(fieldName) : "",
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value: string | boolean | number) =>
      typeof value === "string" && !pattern.test(value.toLowerCase())
        ? message
        : "",
  }),

  boolean: (fieldName: string): ValidationRule => ({
    validate: (value) =>
      typeof value !== "boolean"
        ? messages.validation.mustBeBoolean(fieldName)
        : "",
  }),
};

export const createCourseValidation = () => ({
  termId: [
    {
      validate: (value: string | boolean | number) =>
        !value || value === 0 ? messages.validation.term.required : "",
    },
  ],
  courseName: [
    rules.required("Course Name"),
    rules.pattern(
      /^[a-zA-Z0-9\s-]+$/,
      messages.validation.course.courseNamePattern,
    ),
  ],
  studentsCanCreateProject: [rules.boolean("studentsCanCreateProject")],
});

export const createProjectValidation = () => ({
  projectName: [
    rules.required("projectName"),
    rules.pattern(
      /^[a-zA-Z0-9\s-]+$/,
      messages.validation.project.projectNamePattern,
    ),
  ],
});

export const createTermValidation = () => ({
  termName: [
    rules.required("Term Name"),
    rules.pattern(
      /^(ws|winter|ss|summer)\s*(?:(\d{2}|\d{4})(?:\/(\d{2}))?)$/,
      messages.validation.termName.pattern,
    ),
  ],
  displayName: [
    rules.required("Display Name"),
    rules.pattern(
      /^[a-zA-Z0-9\s-\/]+$/,
      messages.validation.displayName.pattern,
    ),
  ],
});

export const createCourseToTermValidation = () => ({
  courseName: [
    rules.required("Course Name"),
    rules.pattern(
      /^[a-zA-Z0-9\s-]+$/,
      messages.validation.course.courseNamePattern,
    ),
  ],
});

export const useForm = <T extends object>(
  initialValues: T,
  validationSchema: ValidationSchema<T>,
) => {
  const [data, setData] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FormErrors<T>>({} as FormErrors<T>);
  const [init, setInit] = useState(false);

  // Validate a single field
  const validateField = useCallback(
    (field: keyof T, value: string | boolean | number): string => {
      const fieldRules = validationSchema[field];
      if (!fieldRules) return "";

      for (const rule of fieldRules) {
        const error = rule.validate(value);
        if (error) return error as string;
      }

      return "";
    },
    [validationSchema],
  );

  const handleChanges = useCallback(
    (field: keyof T, value: string | boolean | number) => {
      setData((prevData) => ({ ...prevData, [field]: value }));
      setErrors((prevErrors) => ({
        ...prevErrors,
        [field]: validateField(field, value),
      }));
    },
    [validateField],
  );

  // Run initial validation on mount
  useEffect(() => {
    if (init) return;
    setErrors(
      Object.fromEntries(
        Object.entries(initialValues).map(([field, value]) => [
          field,
          validateField(field as keyof T, value),
        ]),
      ) as FormErrors<T>,
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
