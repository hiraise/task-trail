import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ContentTopBarDesktop } from "./ContentTopBarDesktop";
import { ContentTopBarMobile } from "./ContentTopBarMobile";

describe("ContentTopBar without tabs", () => {
  it.each([
    ["phone", ContentTopBarMobile],
    ["desktop", ContentTopBarDesktop],
  ])("%s: renders without a TabPanelProvider, only the sort button", (_, TopBar) => {
    const onClick = vi.fn();

    render(<TopBar onClick={onClick} tabs={false} />);
    fireEvent.click(screen.getByRole("button"));

    expect(screen.getAllByRole("button")).toHaveLength(1);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
