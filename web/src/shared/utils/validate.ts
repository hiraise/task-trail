export const VALIDATION_PATTERNS = {
  email: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
};

/**
 * Returns a validator object for confirming a password match.
 *
 * @param newPassword - The new password to compare against the confirmation input.
 * @returns An object containing validation rules:
 *   - `required`: Error message if the confirmation field is empty.
 *   - `validate`: Function that checks if the confirmation matches the new password,
 *     returning an error message if they do not match.
 *
 * @example
 * const validator = getConfirmPasswordValidator('mySecret');
 * // Use validator in form validation logic
 */
export const getConfirmPasswordValidator = (newPassword: string) => ({
  required: "Повторите новый пароль",
  validate: (value: string) => value === newPassword || "Пароли не совпадают",
});

export const getPasswordValidator = () => ({
  required: "Введите новый пароль",
  minLength: { value: 8, message: "Пароль должен быть не короче 8 символов" },
  validate: (value: string) => {
    if (!/[A-Z]/.test(value)) {
      return "Пароль должен содержать хотя бы одну заглавную букву";
    }
    if (!/[a-z]/.test(value)) {
      return "Пароль должен содержать хотя бы одну строчную букву";
    }
    if (!/[0-9]/.test(value)) {
      return "Пароль должен содержать хотя бы одну цифру";
    }

    return true;
  },
});
