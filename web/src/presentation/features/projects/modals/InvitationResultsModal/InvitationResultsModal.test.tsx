import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { vi } from "vitest";

import type { InvitationResult } from "@/domain/models/Invitation";

import { useAddMembers } from "../../hooks";

import { InvitationResultsModal } from "./InvitationResultsModal";

const link = "http://localhost:3000/auth/invite?token=abc";
let results: InvitationResult[] = [];
const addMembers = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/presentation/shared/hooks/useGlobalModalProps", () => ({
  useGlobalModalProps: () => ({ projectId: "project-1", results }),
}));
vi.mock("@/presentation/shared", () => ({
  BaseModal: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  SubmitButton: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));
vi.mock("../../hooks", () => ({ useAddMembers: vi.fn() }));

const renderModal = () => render(<InvitationResultsModal isOpen onClose={vi.fn()} />);

describe("InvitationResultsModal", () => {
  beforeEach(() => {
    addMembers.mockReset();
    vi.mocked(useAddMembers).mockReturnValue({
      mutateAsync: addMembers,
      isPending: false,
    } as unknown as ReturnType<typeof useAddMembers>);
  });

  it("без почты показывает ссылку приглашения и копирует её", async () => {
    const user = userEvent.setup();
    const writeText = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();

    results = [
      { email: "new@example.com", outcome: "invited", inviteUrl: link },
      { email: "old@example.com", outcome: "added" },
    ];
    renderModal();

    expect(screen.getByDisplayValue(link)).toBeInTheDocument();
    expect(screen.getByText("Добавлен в проект")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Скопировать" }));
    expect(writeText).toHaveBeenCalledWith(link);
    expect(toast.success).toHaveBeenCalledWith("Ссылка скопирована");
  });

  it("«Пригласить снова» зовёт только тех, кому письмо не ушло, и обновляет их строки", async () => {
    const user = userEvent.setup();

    results = [
      { email: "failed@example.com", outcome: "mail_failed" },
      { email: "old@example.com", outcome: "added" },
    ];
    addMembers.mockResolvedValue([{ email: "failed@example.com", outcome: "invited" }]);
    renderModal();

    await user.click(screen.getByRole("button", { name: "Пригласить снова" }));

    expect(addMembers).toHaveBeenCalledWith({
      projectId: "project-1",
      emails: ["failed@example.com"],
    });
    const row = screen.getByText("failed@example.com").closest("li")!;

    expect(within(row).getByText("Приглашение отправлено")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Пригласить снова" })).not.toBeInTheDocument();
  });
});
