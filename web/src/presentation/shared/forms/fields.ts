import z from "zod";

// Form fields with the same limits as in the contract (api/openapi.yaml, schemas Email, Password,
// Username, Project, Task): the web accepts nothing the server rejects and is not stricter than the server.

const encoder = new TextEncoder();

// bcrypt uses only 72 bytes of a password; a Cyrillic letter is 2 bytes in UTF-8
const PASSWORD_MAX_BYTES = 72;

export const emailField = z.email("Введите корректную почту").max(254, "Почта длиннее 254 символов");

export const passwordField = z
  .string()
  .min(8, "Пароль должен содержать минимум 8 символов")
  .refine(
    (value) => encoder.encode(value).length <= PASSWORD_MAX_BYTES,
    "Пароль слишком длинный: до 72 латинских букв или 36 русских",
  );

export const usernameField = z
  .string()
  .trim()
  .min(1, "Введите имя")
  .max(100, "Имя длиннее 100 символов");

// Project name: 1–254 characters; the web trims edge spaces itself, the server does not touch them
export const projectNameField = z
  .string()
  .trim()
  .min(1, "Введите название проекта")
  .max(254, "Название длиннее 254 символов");

// The contract sets no limit on the description; empty means no description
export const projectDescriptionField = z.string().trim();

// Project key — ProjectKey in the contract (ADR-0026): the server also trims and upper-cases it
export const PROJECT_KEY_PATTERN = /^\p{L}[\p{L}0-9]{1,9}$/u;

export const projectKeyField = z
  .string()
  .trim()
  .toUpperCase()
  .regex(PROJECT_KEY_PATTERN, "2–10 букв и цифр, первая — буква");

// Task name: 1–254 characters, like a project; "Fill in the field" is the mockup text
export const taskNameField = z
  .string()
  .trim()
  .min(1, "Заполните поле")
  .max(254, "Название длиннее 254 символов");

// The contract sets no limit on the task description; empty means no description
export const taskDescriptionField = z.string().trim();

/** How many emails the server accepts at once (AddMembersRequest, CreateProjectRequest). */
export const MAX_INVITE_EMAILS = 50;
