import { render } from "@testing-library/react";

import { HighlightedText } from "./HighlightedText";
import { splitByHighlight } from "./splitByHighlight";

describe("splitByHighlight", () => {
  it("returns the text whole for an empty query", () => {
    expect(splitByHighlight("План", "  ")).toEqual(["План"]);
  });

  it("finds every occurrence regardless of case, Cyrillic included", () => {
    expect(splitByHighlight("Подготовить презентацию", "П")).toEqual([
      "",
      "П",
      "одготовить ",
      "п",
      "резентацию",
    ]);
  });

  it("treats regular expression characters literally", () => {
    expect(splitByHighlight("a.b (c)", "(c)")).toEqual(["a.b ", "(c)", ""]);
    expect(splitByHighlight("abc", ".")).toEqual(["abc"]);
  });
});

describe("HighlightedText", () => {
  it("marks the matches", () => {
    const { container } = render(<HighlightedText text="DS-12 Дизайн" highlight=" ds " />);

    expect(container.textContent).toBe("DS-12 Дизайн");
    expect([...container.querySelectorAll("mark")].map((mark) => mark.textContent)).toEqual(["DS"]);
  });
});
