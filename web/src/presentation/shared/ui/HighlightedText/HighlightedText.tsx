import { Fragment } from "react";

import styles from "./HighlightedText.module.css";
import { splitByHighlight } from "./splitByHighlight";

interface HighlightedTextProps {
  text: string;
  /** What to highlight; spaces around it are ignored, an empty one highlights nothing */
  highlight?: string;
}

/** Text with occurrences of a search query in the accent color (search, ADR-0030). */
export function HighlightedText({ text, highlight }: HighlightedTextProps) {
  return splitByHighlight(text, highlight).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className={styles.mark}>
        {part}
      </mark>
    ) : (
      <Fragment key={index}>{part}</Fragment>
    ),
  );
}
