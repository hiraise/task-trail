import { useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";

import styles from "./TaskDetailsDesktop.module.css";
import { Icon } from "@/presentation/ui/Icon";
import { ICONS } from "@/infrastructure/config/icons";

interface TaskDetailsProps {
  icon: React.FC<React.SVGProps<SVGElement>>;
  label: string;
  text: string;
  onClick: () => void;
}

export function TaskDetailsDesktop({ icon, label, text, onClick }: TaskDetailsProps) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div className={styles.detailWrapper}>
      <span className="body-reg-2">{label}</span>
      <button
        className={styles.buttonWrapper}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={styles.button}>
          <Icon as={icon} size="24px" />
          <span className="body-reg-2">{text}</span>
        </div>
        <AnimatePresence>
          {isHovered && (
            <m.div
              className={styles.iconWrapper}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Icon as={ICONS.edit} size="24px" />
            </m.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}
