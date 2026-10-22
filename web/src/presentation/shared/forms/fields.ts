import z from "zod";

// Поля форм с теми же пределами, что в контракте (api/openapi.yaml, схемы Email, Password,
// Username): веб не принимает то, что сервер отвергнет, и не строже сервера.

const encoder = new TextEncoder();

// bcrypt учитывает только 72 байта пароля; русская буква — 2 байта в UTF-8
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
