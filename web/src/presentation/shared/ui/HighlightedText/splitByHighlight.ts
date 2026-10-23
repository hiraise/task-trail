const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Splits text into parts; odd parts are case-insensitive occurrences of `highlight`. */
export function splitByHighlight(text: string, highlight = ""): string[] {
  const query = highlight.trim();

  if (!query) return [text];

  // A capturing group keeps the matches in the result at odd positions
  return text.split(new RegExp(`(${escapeRegExp(query)})`, "giu"));
}
