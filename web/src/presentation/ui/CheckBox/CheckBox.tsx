import { useState } from "react";

import styles from "./CheckBox.module.css";
import { Icon } from "../Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface CheckBoxProps {
  onChange: (checked: boolean) => void;
}

export function CheckBox({ onChange }: CheckBoxProps) {
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = () => {
    setIsChecked(!isChecked);
    onChange(!isChecked);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleCheckboxChange();
    }
  };
  return (
    <div
      className={`${styles.checkBox} ${isChecked ? styles.checked : ""}`}
      onClick={handleCheckboxChange}
      role="checkbox"
      aria-checked={isChecked}
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {isChecked && (
        <div className={styles.checkIcon}>
          <Icon as={ICONS.checkMark} size="14px" inheritColor />
        </div>
      )}
    </div>
  );
}
