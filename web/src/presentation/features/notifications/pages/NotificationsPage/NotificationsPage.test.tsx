import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import type { Notification } from "@/domain/models/Notification";
import { notificationsTexts } from "@/shared/locales/notifications";

import { useNotifications, useReadAllNotifications, useSetNotificationRead } from "../../hooks";

import { NotificationsPage } from "./NotificationsPage";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <a onClick={onClick}>{children}</a>
  ),
}));

vi.mock("../../hooks", () => ({
  useNotifications: vi.fn(),
  useSetNotificationRead: vi.fn(),
  useReadAllNotifications: vi.fn(),
}));

vi.mock("@/presentation/shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useTaskStatuses: () => ({ data: [] }),
}));

const readAll = vi.fn();
const setRead = vi.fn();

const notification: Notification = {
  id: "n1",
  kind: "assigned",
  task: { id: "t1", key: "DS-12", name: "Макет" },
  actor: { id: "u1", email: "anna@example.com", username: "Анна" },
  createdAt: "2026-10-28T09:00:00Z",
};

function listReturns(data: Notification[] | undefined) {
  vi.mocked(useNotifications).mockReturnValue({
    data,
    isPending: data === undefined,
    isError: false,
  } as ReturnType<typeof useNotifications>);
}

describe("NotificationsPage", () => {
  beforeEach(() => {
    readAll.mockReset();
    setRead.mockReset();
    vi.mocked(useReadAllNotifications).mockReturnValue({
      mutate: readAll,
      isPending: false,
    } as unknown as ReturnType<typeof useReadAllNotifications>);
    vi.mocked(useSetNotificationRead).mockReturnValue({
      mutate: setRead,
    } as unknown as ReturnType<typeof useSetNotificationRead>);
  });

  it("the empty state; «Прочитать все» is disabled", () => {
    listReturns([]);
    render(<NotificationsPage />);

    expect(screen.getByText(notificationsTexts.empty)).toBeInTheDocument();
    for (const button of screen.getAllByRole("button", { name: notificationsTexts.readAll })) {
      expect(button).toBeDisabled();
    }
  });

  it("loading shows busy placeholders", () => {
    listReturns(undefined);
    render(<NotificationsPage />);

    expect(screen.getByLabelText(notificationsTexts.loading)).toHaveAttribute("aria-busy", "true");
  });

  it("«Прочитать все» calls the mutation", () => {
    listReturns([notification]);
    render(<NotificationsPage />);

    fireEvent.click(screen.getAllByRole("button", { name: notificationsTexts.readAll })[0]);

    expect(readAll).toHaveBeenCalledOnce();
  });

  it("a click on an unread item marks it read; a read one is left as is", () => {
    listReturns([notification, { ...notification, id: "n2", readAt: "2026-10-28T10:00:00Z" }]);
    render(<NotificationsPage />);

    const items = screen.getAllByText(/назначил\(а\) вас ответственным/);

    fireEvent.click(items[0]);
    fireEvent.click(items[1]);

    expect(setRead).toHaveBeenCalledOnce();
    expect(setRead).toHaveBeenCalledWith({ id: "n1", read: true });
  });
});
