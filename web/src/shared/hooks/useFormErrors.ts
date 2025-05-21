import { useState } from "react";
import { validateForm as validateFormUtil } from "@/shared/utils/validate";

type Validator = (value: string) => string | null;

export const useFormErrors = (
  fields: string[],
  validators?: Record<string, Validator>
) => {
  const initial = Object.fromEntries(fields.map((f) => [f, null])) as Record<
    string,
    string | null
  >;

  const [errors, setErrors] = useState<Record<string, string | null>>(initial);

  const setFieldError = (field: string, message: string | null) =>
    setErrors((prev) => ({ ...prev, [field]: message }));

  const clearFieldError = (field: string) =>
    setErrors((prev) => ({ ...prev, [field]: null }));

  const resetErrors = () => setErrors(initial);

  /**
   * Validates all form fields and updates errors.
   * @param values - object with all field values { email, password, ... }
   * @returns true if there are no errors (validation passed)
   */
  const validateAllFields = (values: Record<string, string>): boolean => {
    if (!validators) return true;
    const { errors: validationErrors, hasError } = validateFormUtil(
      values,
      validators
    );
    setErrors((prev) => ({ ...prev, ...validationErrors }));
    return !hasError;
  };

  return {
    errors,
    setFieldError,
    clearFieldError,
    resetErrors,
    validateAllFields,
    setErrors,
  };
};
