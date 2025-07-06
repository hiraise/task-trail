import { useState, useEffect } from "react";

import styles from "./CheckBox.module.css";
import { Icon } from "../Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface CheckBoxProps {
  onChange: (checked: boolean) => void;
  checked?: boolean;
}

/**
 * A customizable checkbox component that supports both controlled and uncontrolled usage.
 *
 * @param onChange - Callback function called when the checked state changes.
 * @param checked - Optional controlled checked state. If provided, the component acts as a controlled component.
 *
 * @example
 * // Uncontrolled usage
 * <CheckBox onChange={checked => console.log(checked)} />
 *
 * @example
 * // Controlled usage
 * const [checked, setChecked] = useState(false);
 * <CheckBox checked={checked} onChange={setChecked} />
 */
export function CheckBox({ onChange, checked }: CheckBoxProps) {
  const [isChecked, setIsChecked] = useState(checked ?? false);

  useEffect(() => {
    if (checked !== undefined) setIsChecked(checked);
  }, [checked]);

  const currentCheckedState = checked !== undefined ? checked : isChecked;

  const handleCheckboxChange = () => {
    const newCheckedState = !currentCheckedState;
    if (checked === undefined) setIsChecked(newCheckedState);
    onChange(newCheckedState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleCheckboxChange();
    }
  };
  return (
    <div
      className={`${styles.checkBox} ${
        currentCheckedState ? styles.checked : ""
      }`}
      onClick={handleCheckboxChange}
      role="checkbox"
      aria-checked={currentCheckedState}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {currentCheckedState && (
        <div className={styles.checkIcon}>
          <Icon as={ICONS.checkMark} size="14px" inheritColor />
        </div>
      )}
    </div>
  );
}
