import clsx from "clsx";
import { AnimatePresence, motion as m } from "framer-motion";
import { useParams } from "next/navigation";
import { useState } from "react";

import type { ProjectMemberResponseDto } from "@/application/dto/ProjectMemberResponseDto";
import { DropdownMenu, IconButton, UserAvatar } from "@/presentation/shared";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { ICONS } from "@/shared/config/icons";

import { useMembersMenuItems } from "../../hooks/useMembersMenuItems";

import styles from "./MemberCard.module.css";

export function MemberCard({ user }: { user: ProjectMemberResponseDto }) {
  const [isHovered, setIsHovered] = useState(false);

  const params = useParams();
  const projectId = Number(params.id);
  const { data: currentUser } = useGetCurrentUser();
  const { menuItems } = useMembersMenuItems(
    Number(user.id),
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
          <span className="body-med">{user.displayName}</span>
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
