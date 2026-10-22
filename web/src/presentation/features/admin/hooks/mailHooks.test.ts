import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { toast } from "sonner";
import { vi } from "vitest";

import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { AppError, AppErrorType, type ApiErrorCode } from "@/shared/errors/types";
import { adminTexts } from "@/shared/locales/admin";

import { useDisableMail } from "./useDisableMail";
import { useSaveMailSettings } from "./useSaveMailSettings";
import { useSendTestMail } from "./useSendTestMail";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/infrastructure/repositories", () => ({
  adminRepository: { saveMail: vi.fn(), disableMail: vi.fn(), sendTestMail: vi.fn() },
}));

const mail = {
  host: "smtp.example.com",
  port: 587,
  encryption: "starttls" as const,
  sender: "TaskTrail <noreply@example.com>",
  username: "noreply@example.com",
};
const withMail: ServiceSettings = {
  serviceUrl: "http://localhost:3000",
  mail: { ...mail, passwordSet: true },
};
const withoutMail: ServiceSettings = { serviceUrl: "http://localhost:3000", mail: undefined };

/** Cache: service settings and public settings, which the web reads before sign-in. */
function setup<T>(useHook: () => T, settings: ServiceSettings) {
  const queryClient = new QueryClient();

  queryClient.setQueryData(QUERY_KEYS.admin.settings, settings);
  queryClient.setQueryData(QUERY_KEYS.settings.public, {
    registrationOpen: false,
    mailEnabled: !!settings.mail,
  });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(useHook, { wrapper });

  return { queryClient, result };
}

const isInvalidated = (queryClient: QueryClient, queryKey: readonly unknown[]) =>
  queryClient.getQueryState(queryKey)?.isInvalidated;

const apiError = (code: ApiErrorCode) => new AppError(AppErrorType.SERVER, code, { code });

describe("mail in service settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saving puts the response into the cache and refetches mailEnabled", async () => {
    vi.mocked(adminRepository.saveMail).mockResolvedValue(withMail);
    const { queryClient, result } = setup(useSaveMailSettings, withoutMail);

    result.current.mutate({ ...mail, password: "secret" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminRepository.saveMail).toHaveBeenCalledWith({ ...mail, password: "secret" });
    expect(queryClient.getQueryData(QUERY_KEYS.admin.settings)).toEqual(withMail);
    expect(isInvalidated(queryClient, QUERY_KEYS.settings.public)).toBe(true);
  });

  it("disabling removes mail from the settings and refetches mailEnabled", async () => {
    vi.mocked(adminRepository.disableMail).mockResolvedValue();
    const { queryClient, result } = setup(useDisableMail, withMail);

    result.current.mutate();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(QUERY_KEYS.admin.settings)).toEqual(withoutMail);
    expect(isInvalidated(queryClient, QUERY_KEYS.settings.public)).toBe(true);
  });

  it("test email without mail: a text for the administrator, settings are refetched", async () => {
    vi.mocked(adminRepository.sendTestMail).mockRejectedValue(apiError("MAIL_DISABLED"));
    const { queryClient, result } = setup(useSendTestMail, withMail);

    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith(adminTexts.testMailNoMail);
    expect(isInvalidated(queryClient, QUERY_KEYS.admin.settings)).toBe(true);
    expect(isInvalidated(queryClient, QUERY_KEYS.settings.public)).toBe(true);
  });

  it("SMTP rejected the test email: a text for the administrator, not `try again later`", async () => {
    vi.mocked(adminRepository.sendTestMail).mockRejectedValue(apiError("MAIL_SEND_FAILED"));
    const { result } = setup(useSendTestMail, withMail);

    result.current.mutate();
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(toast.error).toHaveBeenCalledWith(adminTexts.testMailRejected);
  });
});
