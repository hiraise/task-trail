import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { Label } from "@/domain/models/Label";

import { LabelOptions } from "./LabelOptions";

const labels: Label[] = ["Баг", "Бэкенд", "Дизайн", "Фронтенд"].map((name, index) => ({
  id: `label-${index}`,
  projectId: "project",
  name,
  color: "gray",
}));

vi.mock("../../hooks", () => ({
  useProjectLabels: () => ({ data: labels, isLoading: false }),
  useCreateLabel: () => ({ mutate: vi.fn(), isPending: false }),
}));

const renderOptions = (selectedIds: string[] = [], onChange = vi.fn()) => {
  render(<LabelOptions projectId="project" selectedIds={selectedIds} onChange={onChange} />);

  return onChange;
};

describe("LabelOptions", () => {
  it("filters labels by name ignoring case", async () => {
    renderOptions();

    await userEvent.type(screen.getByRole("textbox"), "бэк");

    expect(screen.getByText("Бэкенд")).toBeInTheDocument();
    expect(screen.queryByText("Баг")).not.toBeInTheDocument();
  });

  it("a click on a row toggles its label", async () => {
    const onChange = renderOptions(["label-0"]);

    await userEvent.click(screen.getByText("Дизайн"));
    expect(onChange).toHaveBeenLastCalledWith(["label-0", "label-2"]);

    await userEvent.click(screen.getByRole("checkbox", { name: "Баг" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("at the limit unselected rows are disabled and the limit is shown", async () => {
    const selected = ["label-0", ...Array.from({ length: 9 }, (_, index) => `other-${index}`)];
    const onChange = renderOptions(selected);

    expect(screen.getByText("Не больше 10 меток")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Дизайн" })).toHaveAttribute("aria-disabled", "true");

    await userEvent.click(screen.getByText("Дизайн"));
    expect(onChange).not.toHaveBeenCalled();
  });

  it("the create row appears only without an exact match", async () => {
    renderOptions();

    await userEvent.type(screen.getByRole("textbox"), "дизайн");
    expect(screen.queryByText(/Создать метку/)).not.toBeInTheDocument();

    await userEvent.type(screen.getByRole("textbox"), "ер");
    expect(screen.getByText("Создать метку «дизайнер»")).toBeInTheDocument();
  });
});
