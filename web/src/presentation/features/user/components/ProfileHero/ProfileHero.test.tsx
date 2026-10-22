import { vi } from "vitest";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/presentation/shared/hooks", () => ({ useLogout: vi.fn() }));

vi.mock("@/presentation/shared", () => ({
  Icon: () => <span data-testid="icon" />,
  Spinner: () => <span data-testid="spinner" />,
}));
vi.mock("./ProfileAvatar", () => ({
  ProfileAvatar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import type { User } from "@/domain/models/User";
import { useLogout } from "@/presentation/shared/hooks";
import { TEXTS } from "@/shared/locales/texts";

import { ProfileHero } from "./ProfileHero";

const mockLogout = (mutate = vi.fn(), isPending = false) =>
  vi.mocked(useLogout).mockReturnValue({ mutate, isPending } as unknown as ReturnType<
    typeof useLogout
  >);

describe("ProfileHero", () => {
  const user: User = { id: "1", username: "john_doe", email: "john@example.com" };

  beforeEach(() => {
    mockLogout();
  });

  it("shows the name and the email", () => {
    render(<ProfileHero user={user} />);

    expect(screen.getByText("john_doe")).toBeInTheDocument();
    expect(screen.getByText(user.email)).toBeInTheDocument();
  });

  it("without a name shows the beginning of the email", () => {
    render(<ProfileHero user={{ ...user, username: null }} />);

    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent("john");
  });

  it("signs out with the button on the cover", async () => {
    const logout = vi.fn();

    mockLogout(logout);
    render(<ProfileHero user={user} />);
    await userEvent
      .setup()
      .click(screen.getByRole("button", { name: TEXTS.profile.logoutFromAccount }));

    expect(logout).toHaveBeenCalledTimes(1);
  });

  it("while signing out shows a spinner and does not allow pressing again", () => {
    mockLogout(vi.fn(), true);
    render(<ProfileHero user={user} />);

    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: TEXTS.profile.logoutFromAccount })).toBeDisabled();
  });
});
