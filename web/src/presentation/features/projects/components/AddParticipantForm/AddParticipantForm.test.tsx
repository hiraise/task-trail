import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { AddParticipantForm } from "./AddParticipantForm";

vi.mock("@/presentation/shared/hooks", () => ({
  usePublicSettings: () => ({ data: { mailEnabled: false, registrationOpen: false } }),
}));
vi.mock("../UsersList", () => ({ UsersList: () => null }));

describe("AddParticipantForm", () => {
  it("Enter добавляет введённую почту в нижнем регистре, кнопка зовёт выбранных", async () => {
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

  it("введённая, но не добавленная почта уходит вместе с выбранными", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<AddParticipantForm onSubmit={onSubmit} />);
    await user.type(screen.getByRole("textbox"), "typed@example.com");
    await user.click(screen.getByRole("button", { name: "Пригласить в проект" }));

    expect(onSubmit).toHaveBeenCalledWith(["typed@example.com"]);
  });

  it("больше 50 почт не отправляет", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const emails = Array.from({ length: 51 }, (_, i) => `user${i}@example.com`);

    render(<AddParticipantForm initialEmails={emails} onSubmit={onSubmit} />);
    await user.click(screen.getByRole("button", { name: "Пригласить в проект" }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("За раз можно позвать до 50 человек")).toBeInTheDocument();
  });

  it("без почты сервиса подсказка — про ссылку, которую отправят сами", () => {
    render(<AddParticipantForm onSubmit={vi.fn()} />);

    expect(screen.getByText(/вы получите ссылку приглашения/)).toBeInTheDocument();
  });
});
