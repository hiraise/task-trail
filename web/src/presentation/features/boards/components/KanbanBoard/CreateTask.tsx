"use client";

import { Icon } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./KanbanTask.module.css";

interface CreateTaskProps {
  variant: "default" | "short";
}

export function CreateTask({ variant }: CreateTaskProps) {
  const handleClick = () => {
    //TODO: Implement task creation logic
  };

  switch (variant) {
    case "default":
      return (
        <div className={styles.createTaskContainer} onClick={handleClick}>
          <Icon as={ICONS.plus} size="16px" />
          <span>Создать задачу</span>
        </div>
      );

    case "short":
      return (
        <div className={styles.createTaskContainer} onClick={handleClick}>
          <Icon as={ICONS.plus} size="16px" />
        </div>
      );
  }
}
