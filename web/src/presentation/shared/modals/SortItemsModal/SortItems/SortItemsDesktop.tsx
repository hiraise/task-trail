import { RadioButton } from "../../../ui";

import type { SortItemsProps, SortOption } from "./SortItems.types";
import { options } from "./SortItems.types";
import styles from "./SortItemsDesktop.module.css";

export function SortItemsDesktop({ selectedOption, onSelect }: SortItemsProps) {
  return (
    <div className={styles.content}>
      {options.map((option) => (
        <RadioButton<SortOption>
          key={option.value}
          option={option}
          checked={selectedOption?.value === option.value}
          onChange={() => onSelect(option)}
          name="sortOption"
        />
      ))}
    </div>
  );
}
