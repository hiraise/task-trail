import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import type { ProjectMember } from "@/domain/models/ProjectMember";

import { AssigneeList } from "./AssigneeList";

const anna: ProjectMember = {
  id: "0b8c2f4e-3d5a-4a51-9a8e-1c2b3d4e5f60",
  email: "anna@example.com",
  username: "Анна",
  role: "owner",
};
const boris: ProjectMember = {
  id: "7d1e9a52-6f0b-4c1f-8f43-2a9e5b7c1d08",
  email: "boris@example.com",
  username: null,
  role: "member",
};

describe("AssigneeList", () => {
  it("ищет по имени и почте, выбранный отмечен", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(<AssigneeList members={[anna, boris]} selectedId={anna.id} onSelect={onSelect} />);

    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent("Анна");

    await user.type(screen.getByRole("textbox"), "BORIS");
    expect(screen.queryByText("Анна")).not.toBeInTheDocument();

    await user.click(screen.getByText("boris@example.com"));
    expect(onSelect).toHaveBeenCalledWith(boris);
  });

  it("без проекта выбирать не из кого — просит сначала выбрать проект", () => {
    render(<AssigneeList onSelect={vi.fn()} />);

    expect(screen.getByText(/Сначала выберите проект/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("никого не нашли — так и пишет", async () => {
    const user = userEvent.setup();

    render(<AssigneeList members={[anna]} onSelect={vi.fn()} />);
    await user.type(screen.getByRole("textbox"), "кто-то");

    expect(screen.getByText("Никого не найдено")).toBeInTheDocument();
  });
});
