import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AppError, AppErrorType } from "@/shared/errors/types";
import { apiErrorTexts } from "@/shared/locales/apiErrors";

import { LabelForm } from "./LabelForm";

describe("LabelForm", () => {
  it("an empty name shows the error and sends nothing", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<LabelForm onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Название"), "   ");
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText("Заполните поле")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("sends the trimmed name and the chosen color", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <LabelForm initial={{ name: "Дизайн", color: "purple" }} onSubmit={onSubmit} onCancel={vi.fn()} />,
    );
    const name = screen.getByLabelText("Название");

    await user.clear(name);
    await user.type(name, "  Макеты ");
    await user.click(screen.getByRole("radio", { name: "Зелёный" }));
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(onSubmit).toHaveBeenCalledWith({ name: "Макеты", color: "green" });
  });

  it("a taken name is shown under the name field", async () => {
    const user = userEvent.setup();
    const taken = new AppError(AppErrorType.VALIDATION, "taken", {
      code: "LABEL_NAME_TAKEN",
    });
    const onSubmit = vi.fn().mockRejectedValue(taken);

    render(<LabelForm initial={{ name: "Баг", color: "red" }} onSubmit={onSubmit} onCancel={vi.fn()} />);
    await user.click(screen.getByRole("button", { name: "Сохранить" }));

    expect(await screen.findByText(apiErrorTexts.LABEL_NAME_TAKEN!)).toBeInTheDocument();
  });
});
