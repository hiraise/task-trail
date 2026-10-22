import { vi } from "vitest";

import axiosClient from "../http/axiosClient";
import { MAIL_REQUEST_TIMEOUT_MS } from "../http/timeouts";

import { adminRepository } from "./apiAdminRepository";

vi.mock("../http/axiosClient", () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

const http = vi.mocked(axiosClient);

const mail = {
  host: "smtp.example.com",
  port: 587,
  encryption: "starttls" as const,
  sender: "TaskTrail <noreply@example.com>",
  username: "noreply@example.com",
};

const sentBody = () => http.put.mock.calls[0][1];

describe("adminRepository.saveMail", () => {
  beforeEach(() => {
    http.put.mockReset();
    http.put.mockResolvedValue({ serviceUrl: "http://localhost:3000", mail: null });
  });

  it("пароль не введён — поля password нет: сервер оставит сохранённый", async () => {
    await adminRepository.saveMail(mail);

    expect(sentBody()).toEqual(mail);
    expect(sentBody()).not.toHaveProperty("password");
  });

  it("password: undefined — тоже без поля, а не null", async () => {
    await adminRepository.saveMail({ ...mail, password: undefined });

    expect(sentBody()).not.toHaveProperty("password");
  });

  it("null удаляет пароль, строка — новый пароль", async () => {
    await adminRepository.saveMail({ ...mail, password: null });
    expect(sentBody()).toHaveProperty("password", null);

    await adminRepository.saveMail({ ...mail, password: "secret" });
    expect(http.put.mock.calls[1][1]).toHaveProperty("password", "secret");
  });

  it("без входа на SMTP логин уходит как null", async () => {
    await adminRepository.saveMail({ ...mail, username: null });

    expect(sentBody()).toHaveProperty("username", null);
  });

  it("ждёт проверку SMTP дольше обычного запроса", async () => {
    await adminRepository.saveMail(mail);

    expect(http.put.mock.calls[0][2]).toEqual({ timeout: MAIL_REQUEST_TIMEOUT_MS });
  });
});

describe("adminRepository.sendTestMail", () => {
  it("письмо уходит в самом запросе — тайм-аут почты", async () => {
    http.post.mockResolvedValue(undefined);

    await adminRepository.sendTestMail();

    expect(http.post).toHaveBeenCalledWith("/v1/admin/settings/mail/test", undefined, {
      timeout: MAIL_REQUEST_TIMEOUT_MS,
    });
  });
});
