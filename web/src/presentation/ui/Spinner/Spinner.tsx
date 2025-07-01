import React from "react";

import styles from "./Spinner.module.css";

type SpinnerProps = {
  size?: number;
};

export function Spinner({ size = 40 }: SpinnerProps) {
  return (
    <div
      className={styles.spinner}
      style={{ width: size, height: size }}
      data-testid="spinner"
    />
  );
}
