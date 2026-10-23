import { RadioButton } from "@/presentation/shared/ui";

import type { SortItemsProps, SortOption } from "./SortItems.types";
import { options } from "./SortItems.types";
import styles from "./SortItems.module.css";

/** Sort options as radio buttons; the same on every width (ADR-0008). */
export function SortItems({ selected, onSelect }: SortItemsProps) {
  return (
    <div className={styles.content}>
      {options.map((option) => (
        <RadioButton<SortOption>
          key={option.value}
          option={option}
          checked={selected === option.value}
          onChange={() => onSelect(option)}
          name="sortOption"
        />
      ))}
    </div>
  );
}
