import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { toast } from "sonner";
import { vi } from "vitest";

import type { AdminUser } from "@/domain/models/AdminUser";
import { adminRepository } from "@/infrastructure/repositories";
import { QUERY_KEYS } from "@/shared/constants/queryKeys";
import { AppError, AppErrorType } from "@/shared/errors/types";

import { useChangeServiceAdmin } from "./useChangeServiceAdmin";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/infrastructure/repositories", () => ({ adminRepository: { setAdmin: vi.fn() } }));

const admin: AdminUser = {
  id: "0b8c2f4e-3d5a-4a51-9a8e-1c2b3d4e5f60",
  email: "admin@example.com",
  username: "Аня",
  isAdmin: true,
  createdAt: "2026-10-21T08:00:00Z",
};
const user: AdminUser = {
  id: "7d1e9a52-6f0b-4c1f-8f43-2a9e5b7c1d08",
  email: "user@example.com",
  username: null,
  isAdmin: false,
  createdAt: "2026-10-22T08:00:00Z",
};

/** Section cache: the user list, and the current user is the administrator `admin`. */
function setup() {
  const queryClient = new QueryClient();

  queryClient.setQueryData(QUERY_KEYS.admin.users, [admin, user]);
  queryClient.setQueryData(QUERY_KEYS.user.current, { ...admin, avatarUrl: undefined });

  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: queryClient }, children);
  const { result } = renderHook(() => useChangeServiceAdmin(), { wrapper });

  return { queryClient, result };
}

const isInvalidated = (queryClient: QueryClient, queryKey: readonly unknown[]) =>
  queryClient.getQueryState(queryKey)?.isInvalidated;

describe("useChangeServiceAdmin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("the server response replaces the user in the list and leaves the current user alone", async () => {
    vi.mocked(adminRepository.setAdmin).mockResolvedValue({ ...user, isAdmin: true });
    const { queryClient, result } = setup();

    result.current.mutate({ userId: user.id, isAdmin: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(adminRepository.setAdmin).toHaveBeenCalledWith(user.id, true);
    expect(queryClient.getQueryData(QUERY_KEYS.admin.users)).toEqual([admin, { ...user, isAdmin: true }]);
    expect(isInvalidated(queryClient, QUERY_KEYS.user.current)).toBe(false);
    expect(toast.success).toHaveBeenCalledWith("user теперь администратор сервиса");
  });

  it("removed own administrator rights: the current user is refetched", async () => {
    vi.mocked(adminRepository.setAdmin).mockResolvedValue({ ...admin, isAdmin: false });
    const { queryClient, result } = setup();

    result.current.mutate({ userId: admin.id, isAdmin: false });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(isInvalidated(queryClient, QUERY_KEYS.user.current)).toBe(true);
    expect(toast.success).toHaveBeenCalledWith("Аня больше не администратор сервиса");
  });

  it("LAST_ADMIN: the list is refetched, a text about the last administrator", async () => {
    const error = new AppError(AppErrorType.VALIDATION, "last admin", { code: "LAST_ADMIN" });

    vi.mocked(adminRepository.setAdmin).mockRejectedValue(error);
    const { queryClient, result } = setup();

    result.current.mutate({ userId: admin.id, isAdmin: false });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(isInvalidated(queryClient, QUERY_KEYS.admin.users)).toBe(true);
    expect(toast.error).toHaveBeenCalledWith("Нельзя снять последнего администратора сервиса");
  });
});
