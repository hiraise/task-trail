import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ProjectMember } from "@/domain/models/ProjectMember";

import { CommentInput } from "./CommentInput";

vi.mock("@/presentation/shared/hooks", () => ({
  useGetCurrentUser: () => ({ data: { id: "me", email: "me@example.com", username: "Я" } }),
}));

const ANNA = "11111111-1111-1111-1111-111111111111";
const NASTYA = "22222222-2222-2222-2222-222222222222";
const members: ProjectMember[] = [
  { id: ANNA, username: "Анна Петрова", email: "anna@example.com", role: "member" },
  { id: NASTYA, username: "Анастасия Кравец", email: "kravets@example.com", role: "member" },
];

describe("CommentInput mentions", () => {
  it("picks a member with the keyboard and sends the token", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(<CommentInput members={members} submitText="Отправить" onSubmit={onSubmit} />);
    const field = screen.getByRole("combobox");

    await user.type(field, "Посмотри, @Ан");
    expect(screen.getAllByRole("option")).toHaveLength(2);

    await user.keyboard("{ArrowDown}{Enter}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(field).toHaveValue("Посмотри, @Анастасия Кравец ");

    await user.type(field, "и @анна");
    await user.click(screen.getByRole("option", { name: /Анна Петрова/ }));
    expect(field).toHaveValue("Посмотри, @Анастасия Кравец и @Анна Петрова ");

    await user.click(screen.getByRole("button", { name: "Отправить" }));
    expect(onSubmit).toHaveBeenCalledWith(
      `Посмотри, @[Анастасия Кравец](${NASTYA}) и @[Анна Петрова](${ANNA})`,
    );
  });

  it("Escape closes the list without reaching window", async () => {
    const user = userEvent.setup();
    const onWindowEscape = vi.fn();

    render(<CommentInput members={members} submitText="Отправить" onSubmit={vi.fn()} />);

    await user.type(screen.getByRole("combobox"), "@А");
    window.addEventListener("keydown", onWindowEscape);
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("listbox")).toBeNull();
    expect(onWindowEscape).not.toHaveBeenCalled();
    window.removeEventListener("keydown", onWindowEscape);
  });

  it("editing shows names, keeps the mention and cancel restores the decoded text", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <CommentInput
        initialValue={`@[Анна Петрова](${ANNA}), привет`}
        members={members}
        submitText="Изменить"
        onSubmit={onSubmit}
        onCancel={vi.fn()}
      />,
    );
    const field = screen.getByRole("combobox");

    expect(field).toHaveValue("@Анна Петрова, привет");

    fireEvent.change(field, { target: { value: "что-то другое" } });
    await user.click(screen.getByRole("button", { name: "Отменить" }));
    expect(field).toHaveValue("@Анна Петрова, привет");

    await user.click(screen.getByRole("button", { name: "Изменить" }));
    expect(onSubmit).toHaveBeenCalledWith(`@[Анна Петрова](${ANNA}), привет`);
  });
});
