import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { usePublicSettings } from "@/presentation/shared/hooks";
import { notificationsTexts } from "@/shared/locales/notifications";

import { useGetCurrentUser, useSetEmailNotifications } from "../../hooks";

import { EmailNotificationsSwitch } from "./EmailNotificationsSwitch";

vi.mock("../../hooks", () => ({
  useGetCurrentUser: vi.fn(),
  useSetEmailNotifications: vi.fn(),
}));

vi.mock("@/presentation/shared/hooks", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  usePublicSettings: vi.fn(),
}));

const setEnabled = vi.fn();

function setup(mailEnabled: boolean) {
  vi.mocked(useGetCurrentUser).mockReturnValue({
    data: { id: "u1", email: "anna@example.com", username: null, isAdmin: false, emailNotifications: true },
  } as ReturnType<typeof useGetCurrentUser>);
  vi.mocked(usePublicSettings).mockReturnValue({
    data: { registrationOpen: false, mailEnabled },
  } as ReturnType<typeof usePublicSettings>);
  vi.mocked(useSetEmailNotifications).mockReturnValue({
    mutate: setEnabled,
    isPending: false,
  } as unknown as ReturnType<typeof useSetEmailNotifications>);
  render(<EmailNotificationsSwitch />);
}

describe("EmailNotificationsSwitch", () => {
  beforeEach(() => setEnabled.mockReset());

  it("with mail: the hint about 5 minutes; a click turns emails off", () => {
    setup(true);

    expect(screen.getByText(notificationsTexts.emailHint)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: notificationsTexts.emailSwitch }));
    expect(setEnabled).toHaveBeenCalledWith(false);
  });

  it("without mail: says emails do not go, the switch still works", () => {
    setup(false);

    expect(screen.getByText(notificationsTexts.mailDisabled)).toBeInTheDocument();
    fireEvent.click(screen.getByText(notificationsTexts.emailSwitch));
    expect(setEnabled).toHaveBeenCalledWith(false);
  });
});
