import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TaskComment } from "@/domain/models/TaskComment";

import { CommentItem } from "./CommentItem";

vi.mock("../../hooks", () => ({
  useEditComment: () => ({ mutateAsync: vi.fn() }),
  useDeleteComment: () => ({ mutate: vi.fn() }),
}));
vi.mock("@/presentation/shared/hooks/useGlobalModals", () => ({
  useGlobalModals: () => ({ showConfirm: vi.fn() }),
}));

const ANNA = "11111111-1111-1111-1111-111111111111";

describe("CommentItem", () => {
  it("shows a mention as a highlighted name without brackets or the ID", () => {
    const comment = {
      id: "c1",
      taskId: "t1",
      text: `@[Анна Петрова](${ANNA}), см. https://example.com`,
      author: { id: "maria", email: "maria@example.com", username: "Мария" },
      createdAt: "2026-10-24T10:00:00Z",
    } as TaskComment;

    render(<CommentItem comment={comment} userId="other" role="member" readOnly members={[]} />);

    expect(screen.getByText("@Анна Петрова")).toHaveClass(/mention/);
    expect(screen.getByRole("link", { name: "https://example.com" })).toBeInTheDocument();
    expect(document.body.textContent).not.toContain(ANNA);
    expect(document.body.textContent).not.toContain("[");
  });
});
