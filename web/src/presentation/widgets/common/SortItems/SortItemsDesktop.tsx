import styles from "./SortItemsDesktop.module.css";
import { RadioButton } from "@/presentation/ui/RadioButton";
import { options, SortItemsProps, SortOption } from "./SortItems.types";
import { SubmitButton } from "../../auth/_components";
import { TEXTS } from "@/shared/locales/texts";

export function SortItemsDesktop({ selectedOption, onClose, onSelect, onApply }: SortItemsProps) {
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
      <div className={styles.buttons}>
        <SubmitButton $variant="secondary" onClick={onClose}>
          {TEXTS.cancel}
        </SubmitButton>
        <SubmitButton $variant="primary" onClick={onApply}>
          {TEXTS.apply}
        </SubmitButton>
      </div>
    </div>
  );
}
