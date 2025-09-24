import { useRef, useState } from "react";

import styles from "./PasswordInputField.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { Input } from "@/presentation/ui/Input";
import { ICONS } from "@/infrastructure/config/icons";

type PasswordInputFieldProps = React.InputHTMLAttributes<HTMLInputElement>;

export function PasswordInputField(props: PasswordInputFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showIcon, setShowIcon] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleButtonClick = () => {
    setShowPassword((prev) => !prev);
  };

  const handleFocus = () => setShowIcon(true);
  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget as Node)) {
      setShowIcon(false);
      setShowPassword(false);
    }
  };

  return (
    <div
      className={styles.passwordInputContainer}
      ref={containerRef}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <Input type={showPassword ? "text" : "password"} autoComplete="none" {...props} />
      {showIcon && (
        <div className={styles.showPasswordButton}>
          <IconButton
            icon={showPassword ? ICONS.hide : ICONS.show}
            size="32px"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleButtonClick}
            type="button"
          />
        </div>
      )}
    </div>
  );
}
