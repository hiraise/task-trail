import type { SortOptionValue } from "@/shared/utils/sortItems";

export interface SortOption {
  value: SortOptionValue;
  label: string;
}

export const options: SortOption[] = [
  { value: "updatedAt", label: "По дате последнего обновления" },
  { value: "createdAt", label: "По дате создания" },
  { value: "nameAsc", label: "По алфавиту А – Я" },
  { value: "nameDesc", label: "По алфавиту Я – А" },
];

export interface SortItemsProps {
  selected: SortOptionValue;
  onSelect: (option: SortOption) => void;
}
