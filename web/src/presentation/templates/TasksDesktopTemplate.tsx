"use client";

import styles from "./TasksDesktopTemplate.module.css";

import { Drawer } from "../widgets/common/Drawer";
import { SubmitButton } from "../widgets/auth/_components";
import { Icon } from "../ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";
import { TEXTS } from "@/shared/locales/texts";

export function TasksDesktopTemplate({ children }: { children: React.ReactNode }) {
  const handleCreateTask = () => {
    console.log("Create task");
  };
  return (
    <div className={styles.container}>
      <Drawer />
      <div className={styles.contentWrapper}>
        <TopBar
          title={TEXTS.drawer.myTasks}
          buttonText={TEXTS.tasks.createButton}
          onClick={handleCreateTask}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}

interface TopBarProps {
  title: string;
  buttonText: string;
  onClick: () => void;
}

function TopBar({ title, buttonText, onClick }: TopBarProps) {
  return (
    <div className={styles.topBar}>
      <h1 className="medium">{title}</h1>
      <SubmitButton className={styles.button} onClick={onClick}>
        <Icon as={ICONS.plus} size="24px" inheritColor />
        <span className="btn-font-s">{buttonText}</span>
      </SubmitButton>
    </div>
  );
}
