/**
 * @jest-environment jsdom
 */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

jest.mock("@/presentation/shared/hooks", () => ({ useLogout: jest.fn() }));
jest.mock("next/image", () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: () => <img alt="" />,
}));

jest.mock("@/presentation/shared", () => ({
  Icon: () => <span data-testid="icon" />,
  Spinner: () => <span data-testid="spinner" />,
}));
jest.mock("./ProfileAvatar", () => ({
  ProfileAvatar: ({ user, children }: any) => <div data-username={user?.username}>{children}</div>,
}));

import { useLogout } from "@/presentation/shared/hooks";
import { TEXTS } from "@/shared/locales/texts";

import { ProfileHeroDesktop } from "./ProfileHeroDesktop";

describe("ProfileHeroDesktop", () => {
  const mockUser = { id: "1", username: "john_doe", email: "john@example.com", avatarUrl: "" };

  beforeEach(() => {
    (useLogout as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue(null),
      isPending: false,
    });
  });

  it("displays username and email", () => {
    render(<ProfileHeroDesktop user={mockUser} />);
    expect(screen.getByText(mockUser.username)).toBeInTheDocument();
    expect(screen.getByText(mockUser.email)).toBeInTheDocument();
  });

  it("calls logout when clicking the button", async () => {
    const user = userEvent.setup();
    const mockLogout = jest.fn().mockResolvedValue(null);

    (useLogout as jest.Mock).mockReturnValue({ mutateAsync: mockLogout, isPending: false });

    render(<ProfileHeroDesktop user={mockUser} />);
    const button = screen.getByRole("button", { name: TEXTS.profile.logoutFromAccount });

    await user.click(button);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });

  it("renders component in loading state", () => {
    (useLogout as jest.Mock).mockReturnValue({ mutateAsync: jest.fn(), isPending: true });
    render(<ProfileHeroDesktop user={mockUser} />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("icon")).not.toBeInTheDocument();
  });
});
