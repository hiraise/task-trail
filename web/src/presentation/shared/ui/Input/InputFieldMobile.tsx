"use client";

import { useState } from "react";

import { ICONS } from "@/shared/config/icons";

import { IconButton } from "../IconButton";

import styles from "./InputFieldMobile.module.css";
import { InputMobile } from "./InputMobile";

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
