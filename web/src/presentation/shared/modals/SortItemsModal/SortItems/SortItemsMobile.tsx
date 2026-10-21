import { RadioButton } from "@/presentation/shared/ui";

import type { SortItemsProps, SortOption } from "./SortItems.types";
import { options } from "./SortItems.types";
import styles from "./SortItemsMobile.module.css";

export function SortItemsMobile({ selectedOption, onSelect }: SortItemsProps) {
  return (
    <div className={styles.container}>
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
    </div>
  );
}
