import { useState } from "react";
import { useParams } from "next/navigation";
import clsx from "clsx";
import { motion as m, AnimatePresence } from "framer-motion";

import styles from "./MemberCard.module.css";

import { getDisplayName } from "@/shared/utils/getDisplayName";
import { UserAvatar } from "../../common/UserAvatar";
import { User } from "@/domain/user/user.entity";
import { ICONS } from "@/infrastructure/config/icons";
import { IconButton } from "@/presentation/ui/IconButton";
import { DropdownMenu } from "../../common/DropdownMenu";
import { useGetCurrentUser } from "@/application/user/hooks/useGetCurrentUser";
import { useMembersMenuItems } from "@/application/projects/hooks/useMembersMenuItems";

export function MemberCard({ user }: { user: User }) {
  const [isHovered, setIsHovered] = useState(false);

  const params = useParams();
  const projectId = Number(params.id);
  const { data: currentUser } = useGetCurrentUser();
  const { menuItems } = useMembersMenuItems(
    user.id,
    user.username,
    currentUser?.id ?? -1,
    projectId
  );

  return (
    <div
      className={clsx(styles.cardWrapper, { [styles.hovered]: isHovered })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.container}>
        <UserAvatar variant="large" />
        <div className={styles.name}>
          <span className="body-med">{getDisplayName(user)}</span>
          <span className={clsx("body-reg-2", styles.email)}>{user.email}</span>
        </div>
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
            <DropdownMenu
              trigger={<IconButton icon={ICONS.menuHorizontal} size="24px" />}
              items={menuItems}
            />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
