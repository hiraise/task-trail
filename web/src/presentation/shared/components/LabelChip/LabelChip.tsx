import clsx from "clsx";

import type { Label } from "@/domain/models/Label";

import styles from "./LabelChip.module.css";

/** A colored label pill (ADR-0035); a long name ends with "…" and shows in full on hover. */
export function LabelChip({ label }: { label: Label }) {
  return (
    <span className={clsx("caption-med", styles.chip, styles[label.color])} title={label.name}>
      {label.name}
    </span>
  );
}
