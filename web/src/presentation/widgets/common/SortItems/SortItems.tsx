import { useState } from "react";

import { SortItem } from "./SortItem";
import styles from "./SortItems.module.css";

export interface SortOption {
  value: string;
  label: string;
}

export const options = [
  { value: "updatedAt", label: "По дате последнего обновления" },
  { value: "createdAt", label: "По дате создания" },
  { value: "nameAsc", label: "По алфавиту А – Я" },
  { value: "nameDesc", label: "По алфавиту Я – А" },
];

interface SortItemsProps {
  onSelect?: (option: SortOption) => void;
}

export function SortItems({ onSelect }: SortItemsProps) {
  const [selectedOption, setSelectedOption] = useState<SortOption | null>(null);

  const handleSelect = (option: SortOption) => {
    setSelectedOption(option);
    onSelect?.(option);
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {options.map((option) => (
          <SortItem
            key={option.value}
            option={option}
            isSelected={selectedOption?.value === option.value}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}
