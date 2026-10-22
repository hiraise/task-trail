import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AddParticipantForm } from "./AddParticipantForm";

vi.mock("@/presentation/shared/hooks", () => ({
  usePublicSettings: () => ({ data: { mailEnabled: false, registrationOpen: false } }),
}));
vi.mock("../UsersList", () => ({ UsersList: () => null }));

describe("AddParticipantForm", () => {
  it("Enter adds the typed email in lowercase, the button invites the selected ones", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AddParticipantForm initialEmails={["old@example.com"]} onSubmit={onSubmit} />);

    const input = screen.getByRole("textbox");

    await user.type(input, " New@Example.com {Enter}");
    expect(screen.getByText("new@example.com")).toBeInTheDocument();
    expect(input).toHaveValue("");

    await user.click(screen.getByRole("button", { name: "Пригласить в проект" }));
    expect(onSubmit).toHaveBeenCalledWith(["old@example.com", "new@example.com"]);
  });

  it("a typed but not added email is sent along with the selected ones", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AddParticipantForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox"), "typed@example.com");
    await user.click(screen.getByRole("button", { name: "Пригласить в проект" }));

    expect(onSubmit).toHaveBeenCalledWith(["typed@example.com"]);
  });

  it("does not send more than 50 emails", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const emails = Array.from({ length: 51 }, (_, i) => `user${i}@example.com`);

    render(<AddParticipantForm initialEmails={emails} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Пригласить в проект" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("За раз можно позвать до 50 человек")).toBeInTheDocument();
  });

  it("without service mail the hint is about a link users send themselves", () => {
    render(<AddParticipantForm onSubmit={vi.fn()} />);

    expect(screen.getByText(/вы получите ссылку приглашения/)).toBeInTheDocument();
  });
});
