import { motion as m } from "framer-motion";

import styles from "./AssigneeButton.module.css";

import { IconButton } from "@/presentation/ui/IconButton";
import { User } from "@/domain/user/user.entity";
import { ICONS } from "@/infrastructure/config/icons";
import { UserAvatar } from "../../common/UserAvatar";
import { getDisplayName } from "@/shared/utils/getDisplayName";

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
        <span className="body-med">{getDisplayName(user)}</span>
      </div>
    </div>
  );
}
