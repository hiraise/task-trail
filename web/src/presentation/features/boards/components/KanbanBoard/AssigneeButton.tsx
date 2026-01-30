import { motion as m } from "framer-motion";

import type { User } from "@/domain/models/User";
import { IconButton, UserAvatar } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import styles from "./AssigneeButton.module.css";

interface AssigneeButtonProps {
  user: User;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export function AssigneeButton({ user, isCollapsed, toggleCollapse }: AssigneeButtonProps) {
  return (
    <div className={styles.container}>
      <m.div
        animate={{ rotate: isCollapsed ? 0 : 90 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <IconButton icon={ICONS.rightArrow} size="24px" onClick={toggleCollapse} />
      </m.div>
      <div className={styles.userInfo}>
        <UserAvatar variant="small" />
        <span className="body-med">{user.username}</span>
      </div>
    </div>
  );
}
