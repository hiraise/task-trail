export const VALIDATION_PATTERNS = {
  email: /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/,
};

/**
 * Returns an email validator object for form validation.
 *
 * @returns An object containing:
 * - `required`: A string message indicating that the email field is required.
 * - `validate`: A function that takes an email string and returns `true` if the email is valid,
 *   or an error message string if the email is invalid.
 *
 * The validator checks that the email matches a standard email format and provides
 * localized error messages in Russian.
 */
export const getEmailValidator = () => ({
  required: "Email обязателен",
  validate: (email: string) => {
    if (!VALIDATION_PATTERNS.email.test(email)) {
      return "Некорректный email";
    }
    return true;
  },
});

/**
 * Validation rules for a username field, intended for use with React Hook Form (RHF).
 *
 * - `required`: Ensures the field is not left empty. Displays "Поле обязательно" if violated.
 * - `minLength`: Requires at least 3 characters. Displays "Минимум 3 символа" if violated.
 * - `maxLength`: Allows a maximum of 32 characters. Displays "Максимум 32 символа" if violated.
 */
export const userNameValidator = {
  required: "Поле обязательно",
  minLength: { value: 3, message: "Минимум 3 символа" },
  maxLength: { value: 32, message: "Максимум 32 символа" },
};

/**
 * Validation rules for the "old password" input field.
 *
 * - `required`: Ensures the field is not left empty, displaying a message if it is.
 * - `minLength`: Requires the password to be at least 6 characters long, with a corresponding error message.
 *
 * Messages are provided in Russian.
 */
export const oldPasswordValidator = {
  required: "Введите старый пароль",
  minLength: {
    value: 6,
    message: "Старый пароль должен быть не короче 6 символов",
  },
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

export const projectNameValidator = {
  required: "Название проекта обязательно",
  minLength: {
    value: 6,
    message: "Название проекта должно быть не короче 6 символов",
  },
  maxLength: {
    value: 255,
    message: "Название проекта не должно превышать 255 символа",
  },
};

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
