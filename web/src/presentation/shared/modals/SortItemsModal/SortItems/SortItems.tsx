import { RadioButton } from "@/presentation/shared/ui";
import { TASK_SORT_OPTIONS, type SortOptionValue } from "@/shared/utils/sortItems";

import type { SortItemsProps, SortOption } from "./SortItems.types";
import { options } from "./SortItems.types";
import styles from "./SortItems.module.css";

/** Sort options as radio buttons; the same on every width (ADR-0008). */
const isTaskOption = (value: SortOptionValue) =>
  (TASK_SORT_OPTIONS as readonly SortOptionValue[]).includes(value);

export function SortItems({ selected, onSelect, tasks }: SortItemsProps) {
  const shown = tasks ? options : options.filter((option) => !isTaskOption(option.value));

  return (
    <div className={styles.content}>
      {shown.map((option) => (
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
