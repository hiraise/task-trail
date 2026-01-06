import React from "react";

import styles from "./Input.module.css";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ ...props }, ref) => {
  return <input ref={ref} className={styles.input} {...props} />;
});

Input.displayName = "Input";
