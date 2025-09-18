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

export interface SortItemsProps {
  selectedOption: SortOption;
  onSelect: (option: SortOption) => void;
}
