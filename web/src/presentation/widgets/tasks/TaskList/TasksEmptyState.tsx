import Image from "next/image";

import styles from "./TasksEmptyState.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { ASSETS } from "@/infrastructure/config/assets";
import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { SubmitButton } from "../../auth/_components";

export function TasksEmptyState() {
  const handleCreateTask = () => {
    console.log("Create task");
  };
  return (
    <div className={styles.content}>
      <div className={styles.emptyState}>
        <Image src={ASSETS.images.task} width={160} height={160} alt={TEXTS.tasks.taskAlt} />
        <span className="body-reg">{TEXTS.tasks.empty}</span>
        <SubmitButton $variant="text" className={styles.button} onClick={handleCreateTask}>
          <Icon as={ICONS.plus} size="24px" inheritColor />
          <span className="btn-font-s">{TEXTS.tasks.createButton}</span>
        </SubmitButton>
      </div>
    </div>
  );
}
