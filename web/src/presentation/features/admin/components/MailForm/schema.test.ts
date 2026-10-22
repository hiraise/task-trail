import { schema, toFormValues, toNewMailSettings, type FormValues } from "./schema";

const values: FormValues = {
  host: "smtp.example.com",
  port: "587",
  encryption: "starttls",
  sender: "TaskTrail <noreply@example.com>",
  username: "noreply@example.com",
  password: "",
};

describe("mail form → request", () => {
  it("empty password: no password field, the server keeps the saved one", () => {
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

  it("an entered password is sent as a string", () => {
    expect(toNewMailSettings({ ...values, password: "secret" }).password).toBe("secret");
  });

  it("without a login: username null, the password is not sent", () => {
    const request = toNewMailSettings({ ...values, username: "", password: "secret" });

    expect(request.username).toBeNull();
    expect("password" in request).toBe(false);
  });

  it("port is a number from 1 to 65535", () => {
    expect(schema.safeParse({ ...values, port: "0" }).success).toBe(false);
    expect(schema.safeParse({ ...values, port: "65536" }).success).toBe(false);
    expect(schema.safeParse({ ...values, port: "25a" }).success).toBe(false);
    expect(schema.safeParse({ ...values, port: "465" }).success).toBe(true);
  });

  it("without mail: an empty form with STARTTLS", () => {
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
