import { createElement, type ReactNode } from "react";

// http(s) links up to a space; punctuation at the end belongs to the sentence, not the link.
const LINK = /https?:\/\/[^\s<>"]+/g;
const TRAILING = /[.,;:!?)\]}»"']+$/;

/**
 * Plain text with clickable links (ADR-0028: comments have no markup). Links open in a new tab
 * without access to the opener; the rest stays text, so nothing is rendered as HTML.
 */
export function linkify(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;

  for (const match of text.matchAll(LINK)) {
    const url = match[0].replace(TRAILING, "");
    const start = match.index;

    if (start > last) out.push(text.slice(last, start));
    out.push(
      createElement("a", { key: start, href: url, target: "_blank", rel: "noopener noreferrer" }, url),
    );
    last = start + url.length;
  }
  if (last < text.length) out.push(text.slice(last));

  return out;
}
