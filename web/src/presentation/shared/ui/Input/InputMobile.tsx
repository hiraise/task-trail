"use client";

import clsx from "clsx";

import styles from "./InputMobile.module.css";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
  suffixElement?: React.ReactElement;
}

export function InputMobile({ hasError, suffixElement, ...rest }: InputProps) {
  return (
    <div className={styles.inputWrapper}>
      <input
        className={clsx(styles.input, "body-reg-2", { [styles.error]: hasError })}
        id={rest.id}
        {...rest}
      />
      {suffixElement && <div className={styles.suffixWrapper}>{suffixElement}</div>}
    </div>
  );
}
