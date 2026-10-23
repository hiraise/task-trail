import clsx from "clsx";

import { LABEL_COLORS, type LabelColor } from "@/domain/models/Label";
import { tasksTexts } from "@/shared/locales/tasks";

import styles from "./ColorSwatches.module.css";

interface ColorSwatchesProps {
  value: LabelColor;
  onChange: (color: LabelColor) => void;
}

/** The label color picker (ADR-0035): 8 round swatches of the palette, one is selected. */
export function ColorSwatches({ value, onChange }: ColorSwatchesProps) {
  return (
    <div role="radiogroup" aria-label={tasksTexts.labelColor} className={styles.swatches}>
      {LABEL_COLORS.map((color) => (
        <button
          key={color}
          type="button"
          role="radio"
          aria-checked={color === value}
          aria-label={tasksTexts.labelColors[color]}
          className={clsx(styles.swatch, styles[color], color === value && styles.selected)}
          onClick={() => onChange(color)}
        />
      ))}
    </div>
  );
}
