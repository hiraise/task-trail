import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { linkify } from "./linkify";

const html = (text: string) => renderToStaticMarkup(createElement(Fragment, null, ...linkify(text)));

describe("linkify", () => {
  it("turns http and https links into links that open in a new tab", () => {
    expect(html("См. https://example.com/a?b=1 и http://x.ru")).toBe(
      'См. <a href="https://example.com/a?b=1" target="_blank" rel="noopener noreferrer">https://example.com/a?b=1</a>' +
        ' и <a href="http://x.ru" target="_blank" rel="noopener noreferrer">http://x.ru</a>',
    );
  });

  it("leaves punctuation at the end of a sentence outside the link", () => {
    expect(html("Тут: https://example.com.")).toBe(
      'Тут: <a href="https://example.com" target="_blank" rel="noopener noreferrer">https://example.com</a>.',
    );
  });

  it("keeps other text as text, markup included", () => {
    expect(html("<b>жирный</b> javascript:alert(1) www.example.com")).toBe(
      "&lt;b&gt;жирный&lt;/b&gt; javascript:alert(1) www.example.com",
    );
    expect(linkify("")).toEqual([]);
  });
});
