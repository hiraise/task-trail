"use client";

import styles from "./TasksDesktopTemplate.module.css";

import { Drawer } from "../widgets/common/Drawer";

export function TasksDesktopTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.container}>
      <Drawer />
      {children}
    </div>
  );
}
