import styles from "./FloatingButtonDesktop.module.css";

import { ICONS } from "@/infrastructure/config/icons";
import { Icon } from "@/presentation/ui/Icon";
import { useGlobalModals } from "@/shared/hooks/useGlobalModals";
import { TEXTS } from "@/shared/locales/texts";

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
