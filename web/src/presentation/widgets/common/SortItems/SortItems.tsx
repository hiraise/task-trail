import styles from "./SortItems.module.css";
import { RadioButton } from "@/presentation/ui/RadioButton";
import { options, SortItemsProps, SortOption } from "./SortItems.types";

export function SortItems({ selectedOption, onSelect }: SortItemsProps) {
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
