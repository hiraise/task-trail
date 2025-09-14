import styles from "./SortItem.module.css";
import { SortOption } from "./SortItems";

interface SortItemProps {
  option: SortOption;
  isSelected: boolean;
  onSelect: (option: SortOption) => void;
}

export function SortItem({ option, isSelected, onSelect }: SortItemProps) {
  return (
    <div className={styles.option}>
      <p className={styles.text}>{option.label}</p>
      <input
        className={styles.radio}
        type="radio"
        name="sortOption"
        value={option.value}
        checked={isSelected}
        onChange={() => onSelect?.(option)}
        aria-label={`Сортировать ${option.label}`}
      />
    </div>
  );
}
