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
  ProfileAvatar: ({
    user,
    children,
  }: {
    user: { username?: string };
    children: React.ReactNode;
  }) => <div data-username={user?.username}>{children}</div>,
}));

import { useLogout } from "@/presentation/shared/hooks";
import { TEXTS } from "@/shared/locales/texts";

import { ProfileHeroDesktop } from "./ProfileHeroDesktop";

describe("ProfileHeroDesktop", () => {
  const mockUser = { id: "1", username: "john_doe", email: "john@example.com", avatarUrl: "" };

  beforeEach(() => {
    vi.mocked(useLogout).mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(null),
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);
  });

  it("displays username and email", () => {
    render(<ProfileHeroDesktop user={mockUser} />);
    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it("calls logout when clicking the button", async () => {
    const user = userEvent.setup();
    const mockLogout = vi.fn().mockResolvedValue(null);

    vi.mocked(useLogout).mockReturnValue({
      mutateAsync: mockLogout,
      isPending: false,
    } as unknown as ReturnType<typeof useLogout>);

    render(<ProfileHeroDesktop user={mockUser} />);
    const button = screen.getByRole("button", { name: TEXTS.profile.logoutFromAccount });

    await user.click(button);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders component in loading state", () => {
    vi.mocked(useLogout).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: true,
    } as unknown as ReturnType<typeof useLogout>);
    render(<ProfileHeroDesktop user={mockUser} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });
});
