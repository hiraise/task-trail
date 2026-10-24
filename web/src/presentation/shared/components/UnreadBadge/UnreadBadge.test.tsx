import { render, screen } from "@testing-library/react";

import { UnreadBadge } from "./UnreadBadge";

describe("UnreadBadge", () => {
  it("shows nothing for zero", () => {
    const { container } = render(<UnreadBadge count={0} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the count and names it for screen readers", () => {
    render(<UnreadBadge count={3} />);

    expect(screen.getByRole("img", { name: "3 непрочитанных" })).toHaveTextContent("3");
  });

  it("caps the shown number at 99+", () => {
    render(<UnreadBadge count={120} />);

    expect(screen.getByRole("img", { name: "120 непрочитанных" })).toHaveTextContent("99+");
  });
});
