import z from "zod";

// Поля форм с теми же пределами, что в контракте (api/openapi.yaml, схемы Email, Password,
// Username, Project, Task): веб не принимает то, что сервер отвергнет, и не строже сервера.

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

// Название проекта — 1–254 символа; пробелы по краям веб обрезает сам: сервер их не трогает
export const projectNameField = z
  .string()
  .trim()
  .min(1, "Введите название проекта")
  .max(254, "Название длиннее 254 символов");

// Описание в контракте без предела; пустое — описания нет
export const projectDescriptionField = z.string().trim();

// Название задачи — 1–254 символа, как у проекта; «Заполните поле» — текст макета
export const taskNameField = z
  .string()
  .trim()
  .min(1, "Заполните поле")
  .max(254, "Название длиннее 254 символов");

// Описание задачи в контракте без предела; пустое — описания нет
export const taskDescriptionField = z.string().trim();

/** Сколько почт за раз принимает сервер (AddMembersRequest, CreateProjectRequest). */
export const MAX_INVITE_EMAILS = 50;
