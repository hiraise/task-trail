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

  it("no password entered — no password field: the server keeps the saved one", async () => {
    await adminRepository.saveMail(mail);

    expect(sentBody()).toEqual(mail);
    expect(sentBody()).not.toHaveProperty("password");
  });

  it("password: undefined — also no field, not null", async () => {
    await adminRepository.saveMail({ ...mail, password: undefined });

    expect(sentBody()).not.toHaveProperty("password");
  });

  it("null deletes the password, a string is a new password", async () => {
    await adminRepository.saveMail({ ...mail, password: null });
    expect(sentBody()).toHaveProperty("password", null);

    await adminRepository.saveMail({ ...mail, password: "secret" });
    expect(http.put.mock.calls[1][1]).toHaveProperty("password", "secret");
  });

  it("without SMTP login the username is sent as null", async () => {
    await adminRepository.saveMail({ ...mail, username: null });

    expect(sentBody()).toHaveProperty("username", null);
  });

  it("waits for the SMTP check longer than a regular request", async () => {
    await adminRepository.saveMail(mail);

    expect(http.put.mock.calls[0][2]).toEqual({ timeout: MAIL_REQUEST_TIMEOUT_MS });
  });
});

describe("adminRepository.sendTestMail", () => {
  it("the email is sent within the request — mail timeout", async () => {
    http.post.mockResolvedValue(undefined);

    await adminRepository.sendTestMail();

    expect(http.post).toHaveBeenCalledWith("/v1/admin/settings/mail/test", undefined, {
      timeout: MAIL_REQUEST_TIMEOUT_MS,
    });
  });
});
