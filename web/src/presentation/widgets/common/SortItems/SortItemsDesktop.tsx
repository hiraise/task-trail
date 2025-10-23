import styles from "./SortItemsDesktop.module.css";
import { RadioButton } from "@/presentation/ui/RadioButton";
import { options, SortItemsProps, SortOption } from "./SortItems.types";

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
