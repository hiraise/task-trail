import { Icon } from "@/presentation/shared";
import { useGlobalModals } from "@/presentation/shared/hooks/useGlobalModals";
import { ICONS } from "@/shared/config/icons";
import { TEXTS } from "@/shared/locales/texts";

import styles from "./FloatingButtonDesktop.module.css";

export function FloatingButtonDesktop() {
  const { showCreateTask } = useGlobalModals();

  return (
    <button className={styles.container} onClick={showCreateTask}>
      <span className="btn-font-m">{TEXTS.tasks.createButton}</span>
      <div className={styles.icon}>
        <Icon as={ICONS.plus} size="32px" inheritColor />
      </div>
    </button>
  );
}
