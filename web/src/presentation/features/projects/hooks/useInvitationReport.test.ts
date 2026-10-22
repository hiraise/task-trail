import { renderHook } from "@testing-library/react";
import { toast } from "sonner";
import { vi } from "vitest";

import type { InvitationResult } from "@/domain/models/Invitation";

import { invitationSummary, needsAttention, useInvitationReport } from "./useInvitationReport";

const showInvitationResults = vi.fn();

vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: () => ({ showInvitationResults }),
}));

const result = (outcome: InvitationResult["outcome"], inviteUrl?: string): InvitationResult => ({
  email: `${outcome}@example.com`,
  outcome,
  inviteUrl,
});

describe("результат приглашения", () => {
  beforeEach(() => {
    showInvitationResults.mockReset();
    vi.mocked(toast.success).mockReset();
  });

  it("окно нужно, когда есть ссылка для отправки вручную или письмо не ушло", () => {
    expect(needsAttention([result("added"), result("invited")])).toBe(false);
    expect(needsAttention([result("invited", "http://localhost:3000/auth/invite?token=a")])).toBe(true);
    expect(needsAttention([result("mail_failed")])).toBe(true);
  });

  it("итог считает добавленных, приглашённых и тех, кто уже в проекте", () => {
    expect(invitationSummary([result("added"), result("added"), result("already_member")])).toBe(
      "Добавлены в проект: 2. Уже в проекте: 1",
    );
  });

  it("всё ушло письмами — тост; есть ссылка — окно со всеми результатами", () => {
    const { result: hook } = renderHook(() => useInvitationReport());

    hook.current("project-1", [result("invited")]);
    expect(toast.success).toHaveBeenCalledWith("Приглашения отправлены: 1");
    expect(showInvitationResults).not.toHaveBeenCalled();

    const withLink = [result("added"), result("invited", "http://localhost:3000/auth/invite?token=a")];

    hook.current("project-1", withLink);
    expect(showInvitationResults).toHaveBeenCalledWith({ projectId: "project-1", results: withLink });
  });

  it("никого не звали — молчит", () => {
    const { result: hook } = renderHook(() => useInvitationReport());

    hook.current("project-1", []);
    expect(toast.success).not.toHaveBeenCalled();
    expect(showInvitationResults).not.toHaveBeenCalled();
  });
});
