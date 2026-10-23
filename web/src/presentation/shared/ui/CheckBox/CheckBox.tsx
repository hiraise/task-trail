import clsx from "clsx";
import { useState } from "react";

import { ICONS } from "@/shared/config/icons";

import { Icon } from "../Icon";

import styles from "./CheckBox.module.css";

interface CheckBoxProps {
  onChange: (checked: boolean) => void;
  checked?: boolean;
  /** Dimmed, ignores clicks and keys */
  disabled?: boolean;
  "aria-label"?: string;
}

/**
 * A customizable checkbox component that supports both controlled and uncontrolled usage.
 *
 * @param onChange - Callback function called when the checked state changes.
 * @param checked - Optional controlled checked state. If provided, the component acts as a controlled component.
 * @param disabled - Optional: the checkbox is dimmed and does not change.
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
export function CheckBox({ onChange, checked, disabled = false, "aria-label": ariaLabel }: CheckBoxProps) {
  const [isChecked, setIsChecked] = useState(false);

  const isControlled = checked !== undefined;
  const currentCheckedState = isControlled ? checked : isChecked;

  const handleCheckboxChange = () => {
    if (disabled) return;

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
      className={clsx(styles.checkBox, currentCheckedState && styles.checked, disabled && styles.disabled)}
      onClick={handleCheckboxChange}
      role="checkbox"
      aria-checked={currentCheckedState}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
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
