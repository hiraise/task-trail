import { useState } from "react";

import { SortItem } from "./SortItem";
import styles from "./SortProjects.module.css";

const optionsText = {
  title: "Сортировка",
};

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

interface SortProjectsProps {
  onSelect?: (option: SortOption) => void;
}

export function SortProjects({ onSelect }: SortProjectsProps) {
  const [selectedOption, setSelectedOption] = useState<SortOption | null>(null);

  const handleSelect = (option: SortOption) => {
    setSelectedOption(option);
    onSelect?.(option);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{optionsText.title}</h2>
      <div className={styles.options}>
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
