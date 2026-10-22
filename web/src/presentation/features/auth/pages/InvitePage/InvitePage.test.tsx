import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AppError, AppErrorType, type ApiErrorCode } from "@/shared/errors/types";
import { authTexts } from "@/shared/locales/auth";

import { useAcceptInvitation, useInvitation } from "../../hooks";

import { InvitePage } from "./InvitePage";

const navigate = vi.fn();
let search: { token?: string } = { token: "invite-token" };

vi.mock("@tanstack/react-router", () => ({
  useSearch: () => search,
  useNavigate: () => navigate,
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}));

vi.mock("../../hooks", () => ({
  useInvitation: vi.fn(),
  useAcceptInvitation: vi.fn(),
}));

const accept = vi.fn();

const invitationQuery = (state: Partial<ReturnType<typeof useInvitation>>) =>
  ({ data: undefined, error: null, isPending: false, refetch: vi.fn(), ...state }) as unknown as ReturnType<
    typeof useInvitation
  >;

const apiError = (code: ApiErrorCode) =>
  new AppError(AppErrorType.VALIDATION, code.toLowerCase(), { code });

describe("InvitePage", () => {
  beforeEach(() => {
    search = { token: "invite-token" };
    navigate.mockReset();
    accept.mockReset();
    vi.mocked(useAcceptInvitation).mockReturnValue({
      mutate: accept,
      isPending: false,
    } as unknown as ReturnType<typeof useAcceptInvitation>);
  });

  it("a valid invitation: a form with the invitation email, name and password are sent with the token", async () => {
    vi.mocked(useInvitation).mockReturnValue(
      invitationQuery({
        data: { email: "new@example.com", projectName: "Ремонт", invitedBy: "Анна" },
      }),
    );
    const user = userEvent.setup();

    render(<InvitePage />);

    expect(screen.getByText(/Анна приглашает вас в проект «Ремонт»/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("new@example.com")).toBeDisabled();

    await user.type(screen.getByPlaceholderText(authTexts.usernamePlaceholder), "Пётр");
    await user.type(screen.getByPlaceholderText(authTexts.passwordPlaceholder), "secret-password");
    await user.click(screen.getByRole("button", { name: authTexts.invite.accept }));

    expect(accept).toHaveBeenCalledWith({
      token: "invite-token",
      username: "Пётр",
      password: "secret-password",
    });
  });

  it("an account with the email already exists (INVITATION_ACCEPTED): suggests signing in", async () => {
    vi.mocked(useInvitation).mockReturnValue(
      invitationQuery({ error: apiError("INVITATION_ACCEPTED") }),
    );
    const user = userEvent.setup();

    render(<InvitePage />);

    expect(screen.getByRole("heading", { name: authTexts.invite.acceptedTitle })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: authTexts.invite.accept })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: authTexts.login.login }));

    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ to: "/auth" }));
  });

  it("the link is wrong or expired (LINK_INVALID): says so without a form", () => {
    vi.mocked(useInvitation).mockReturnValue(invitationQuery({ error: apiError("LINK_INVALID") }));

    render(<InvitePage />);

    expect(screen.getByRole("heading", { name: authTexts.invite.invalidTitle })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: authTexts.invite.accept })).not.toBeInTheDocument();
  });

  it("a link without a token: the same invalid link, no request", () => {
    search = {};
    vi.mocked(useInvitation).mockReturnValue(invitationQuery({ isPending: true }));

    render(<InvitePage />);

    expect(screen.getByRole("heading", { name: authTexts.invite.invalidTitle })).toBeInTheDocument();
  });
});
