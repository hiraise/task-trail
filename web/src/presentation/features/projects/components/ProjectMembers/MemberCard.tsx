import clsx from "clsx";
import { useParams } from "@tanstack/react-router";
import { AnimatePresence, motion as m } from "framer-motion";
import { useState } from "react";

import { getProjectMemberDisplayName, type ProjectMember } from "@/domain/models/ProjectMember";
import type { ProjectId } from "@/domain/types";
import { DropdownMenu, IconButton, UserAvatar } from "@/presentation/shared";
import { ICONS } from "@/shared/config/icons";

import { useMembersMenuItems } from "../../hooks/useMembersMenuItems";

import styles from "./MemberCard.module.css";

export function MemberCard({ user }: { user: ProjectMember }) {
  const [isHovered, setIsHovered] = useState(false);

  const params = useParams({ from: "/_main/projects/$id/" });
  const projectId = params.id as ProjectId;
  const { menuItems } = useMembersMenuItems(user.id, user.username, projectId);

  return (
    <div
      className={clsx(styles.cardWrapper, { [styles.hovered]: isHovered })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={styles.container}>
        <UserAvatar variant="large" />
        <div className={styles.name}>
          <span className="body-med">{getProjectMemberDisplayName(user)}</span>
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
