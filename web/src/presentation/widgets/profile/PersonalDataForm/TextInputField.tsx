import styles from "./TextInputField.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { InputMobile } from "../../auth/_components/InputMobile";

interface TextInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  showCleanButton?: boolean;
  onClean?: () => void;
}

export function TextInputField(props: TextInputFieldProps) {
  const { hasError, showCleanButton, onClean, ...rest } = props;

  const suffixElement =
    showCleanButton && onClean ? (
      <div className={styles.showClearButton}>
        <IconButton
          icon={ICONS.close}
          size="24px"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClean}
          type="button"
        />
      </div>
    ) : undefined;

  return (
    <div className={styles.container}>
      <InputMobile
        type="text"
        autoComplete="none"
        hasError={hasError}
        suffixElement={suffixElement}
        {...rest}
      />
    </div>
  );
}
