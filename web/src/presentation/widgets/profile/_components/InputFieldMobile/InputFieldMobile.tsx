import { useState } from "react";

import styles from "./InputFieldMobile.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { InputMobile } from "@/presentation/widgets/auth/_components/InputMobile";

type InputMode = "password" | "text";

interface InputFieldMobileProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mode: InputMode;
  hasError?: boolean;
  showSuffixButton?: boolean;
  onClean?: () => void;
}

export function InputFieldMobile(props: InputFieldMobileProps) {
  const { mode, hasError, showSuffixButton, onClean, ...rest } = props;
  const [showPassword, setShowPassword] = useState(false);

  const handleButtonClick = () => setShowPassword((prev) => !prev);

  let suffixElement: React.ReactNode;

  switch (mode) {
    case "password":
      suffixElement = (
        <div className={styles.button}>
          <IconButton
            icon={showPassword ? ICONS.hide : ICONS.show}
            size="24px"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleButtonClick}
            type="button"
          />
        </div>
      );
      break;

    case "text":
      suffixElement = (
        <div className={styles.button}>
          <IconButton
            icon={ICONS.close}
            size="24px"
            onMouseDown={(e) => e.preventDefault()}
            onClick={onClean}
            type="button"
          />
        </div>
      );
      break;
  }

  //   const suffixElement = showButton ? (
  //     <div className={styles.showClearButton}>
  //       <IconButton
  //         icon={showPassword ? ICONS.hide : ICONS.show}
  //         size="24px"
  //         onMouseDown={(e) => e.preventDefault()}
  //         onClick={handleButtonClick}
  //         type="button"
  //       />
  //     </div>
  //   ) : undefined;

  const inputType = mode === "password" ? (showPassword ? "text" : "password") : "text";

  return (
    <div className={styles.container}>
      <InputMobile
        type={inputType}
        autoComplete="none"
        hasError={hasError}
        suffixElement={showSuffixButton ? suffixElement : undefined}
        {...rest}
      />
    </div>
  );
}
