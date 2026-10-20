"use client";

import React, { useEffect, useImperativeHandle, useRef } from "react";

import styles from "./Textarea.module.css";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>((props, ref) => {
  const innerRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = innerRef.current;

    if (!textarea) return;

    const setHeight = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    setHeight();
    textarea.addEventListener("input", setHeight);

    return () => {
      textarea.removeEventListener("input", setHeight);
    };
  }, []);

  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  return <textarea {...props} ref={innerRef} className={styles.textarea} />;
});

Textarea.displayName = "Textarea";
