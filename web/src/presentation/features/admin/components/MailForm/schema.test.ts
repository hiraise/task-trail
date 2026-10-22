import { schema, toFormValues, toNewMailSettings, type FormValues } from "./schema";

const values: FormValues = {
  host: "smtp.example.com",
  port: "587",
  encryption: "starttls",
  sender: "TaskTrail <noreply@example.com>",
  username: "noreply@example.com",
  password: "",
};

describe("форма почты → запрос", () => {
  it("пустой пароль — поля password нет: сервер оставит сохранённый", () => {
    const request = toNewMailSettings(values);

    expect(request).toEqual({
      host: "smtp.example.com",
      port: 587,
      encryption: "starttls",
      sender: "TaskTrail <noreply@example.com>",
      username: "noreply@example.com",
    });
    expect("password" in request).toBe(false);
  });

  it("введённый пароль уходит строкой", () => {
    expect(toNewMailSettings({ ...values, password: "secret" }).password).toBe("secret");
  });

  it("без логина — username: null, пароль не отправляется", () => {
    const request = toNewMailSettings({ ...values, username: "", password: "secret" });

    expect(request.username).toBeNull();
    expect("password" in request).toBe(false);
  });

  it("порт — число от 1 до 65535", () => {
    expect(schema.safeParse({ ...values, port: "0" }).success).toBe(false);
    expect(schema.safeParse({ ...values, port: "65536" }).success).toBe(false);
    expect(schema.safeParse({ ...values, port: "25a" }).success).toBe(false);
    expect(schema.safeParse({ ...values, port: "465" }).success).toBe(true);
  });

  it("без почты — пустая форма со STARTTLS", () => {
    expect(toFormValues(undefined)).toEqual({
      host: "",
      port: "",
      encryption: "starttls",
      sender: "",
      username: "",
      password: "",
    });
  });
});
