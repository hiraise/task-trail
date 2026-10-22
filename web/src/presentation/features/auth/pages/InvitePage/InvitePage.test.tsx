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

  it("действующее приглашение — форма с почтой из приглашения, имя и пароль уходят с токеном", async () => {
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

  it("аккаунт с почтой уже есть (INVITATION_ACCEPTED) — предлагает войти", async () => {
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

  it("ссылка неверна или истекла (LINK_INVALID) — сообщает об этом без формы", () => {
    vi.mocked(useInvitation).mockReturnValue(invitationQuery({ error: apiError("LINK_INVALID") }));

    render(<InvitePage />);

    expect(screen.getByRole("heading", { name: authTexts.invite.invalidTitle })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: authTexts.invite.accept })).not.toBeInTheDocument();
  });

  it("ссылка без токена — та же недействительная ссылка, запроса нет", () => {
    search = {};
    vi.mocked(useInvitation).mockReturnValue(invitationQuery({ isPending: true }));

    render(<InvitePage />);

    expect(screen.getByRole("heading", { name: authTexts.invite.invalidTitle })).toBeInTheDocument();
  });
});
