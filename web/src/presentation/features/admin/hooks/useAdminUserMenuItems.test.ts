import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { vi } from "vitest";

import type { AdminUser } from "@/domain/models/AdminUser";
import type { ServiceSettings } from "@/domain/models/ServiceSettings";
import type { UserId } from "@/domain/types";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { adminTexts } from "@/shared/locales/admin";

import { useAdminUserMenuItems } from "./useAdminUserMenuItems";

const me: AdminUser = {
  id: "11111111-1111-4111-8111-111111111111" as UserId,
  email: "maria@example.com",
  username: "Мария",
  isAdmin: true,
  createdAt: "2026-10-01T10:00:00Z",
};
const anna: AdminUser = {
  id: "22222222-2222-4222-8222-222222222222" as UserId,
  email: "anna@example.com",
  username: "Анна",
  isAdmin: false,
  createdAt: "2026-10-02T10:00:00Z",
};

vi.mock("@/presentation/shared/hooks", () => ({
  useGetCurrentUser: () => ({ data: { ...me } }),
}));
vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: () => ({ showConfirm: vi.fn(), showPasswordResetLink: vi.fn() }),
}));

const mailOn: ServiceSettings = {
  serviceUrl: "http://localhost:3000",
  mail: {
    host: "smtp.example.com",
    port: 587,
    encryption: "starttls",
    sender: "TaskTrail <noreply@example.com>",
    passwordSet: false,
  },
};
const mailOff: ServiceSettings = { serviceUrl: "http://localhost:3000" };

function labels(user: AdminUser, settings: ServiceSettings) {
  const queryClient = new QueryClient();

  queryClient.setQueryData(QUERY_KEYS.admin.settings, settings);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(() => useAdminUserMenuItems(user), { wrapper });

  return result.current.menuItems.map((item) => item.label);
}

const texts = adminTexts.users;

describe("administrator actions on a user", () => {
  it("with mail: a reset email and, in case the mailbox is lost, a link", () => {
    expect(labels(anna, mailOn)).toEqual([texts.makeAdmin, texts.sendResetMail, texts.resetLink]);
  });

  it("without mail: only a reset link", () => {
    expect(labels(anna, mailOff)).toEqual([texts.makeAdmin, texts.resetLink]);
  });

  it("an administrator can be demoted; no password reset is offered for oneself", () => {
    expect(labels(me, mailOn)).toEqual([texts.removeAdmin]);
  });
});
