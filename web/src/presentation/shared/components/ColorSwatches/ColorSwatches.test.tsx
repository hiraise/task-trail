import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ColorSwatches } from "./ColorSwatches";

describe("ColorSwatches", () => {
  it("marks the value and reports a clicked color", async () => {
    const onChange = vi.fn();

    render(<ColorSwatches value="gray" onChange={onChange} />);

    expect(screen.getAllByRole("radio")).toHaveLength(8);
    expect(screen.getByRole("radio", { name: "Серый" })).toHaveAttribute("aria-checked", "true");

    await userEvent.click(screen.getByRole("radio", { name: "Синий" }));

    expect(onChange).toHaveBeenCalledWith("blue");
  });
});
