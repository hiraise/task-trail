export function validateEmail(email: string): string | null {
  if (!email) return "Email обязателен";
  if (!/^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/.test(email))
    return "Некорректный email";
  return null;
}

export const validators = {
  email: validateEmail,
};


/**
 * Validates all form fields.
 * @param values - object { field: value }
 * @param validators - object { field: (value) => error | null }
 * @returns errors: { [field]: error | null }, hasError: boolean
 */
export function validateForm(
  values: Record<string, string>,
  validators: Record<string, (value: string) => string | null>
) {
  const errors: Record<string, string | null> = {};
  let hasError = false;

  Object.entries(validators).forEach(([field, validate]) => {
    const error = validate(values[field] ?? "");
    errors[field] = error;
    if (error) hasError = true;
  });

  return { errors, hasError };
}
