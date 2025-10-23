import { useState } from "react";
import { motion as m, AnimatePresence } from "framer-motion";

import styles from "./ProjectMembers.module.css";

import { TEXTS } from "@/shared/locales/texts";
import { IconButton } from "@/presentation/ui/IconButton";
import { ICONS } from "@/infrastructure/config/icons";
import { MembersAvatarList } from "../../tasks/ProjectsList/MembersAvatarList";
import { ProjectMember } from "@/domain/project/project.entity";
import { MemberTag } from "./MemberTag";
import { User } from "@/domain/user/user.entity";
import { MemberCard } from "./MemberCard";

const convertProjectMemberToUser = (member: ProjectMember): User => {
  return {
    id: member.id,
    username: member.username,
    email: member.email,
    avatarUrl: undefined,
  };
};

export function ProjectMembers({ members }: { members: ProjectMember[] }) {
  const memberIds = members.map((member) => member.id) || [];
  const [isExpanded, setIsExpanded] = useState(false);

  console.log("Members: ", members);

  const toogleExpanded = () => setIsExpanded((prev) => !prev);

  return (
    <div className={styles.container}>
      <div className={styles.titleWrapper}>
        <h4>{TEXTS.projects.members}</h4>
        <m.div
          animate={{ rotate: isExpanded ? 90 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <IconButton icon={ICONS.rightArrow} size="24px" onClick={toogleExpanded} />
        </m.div>
      </div>
      <AnimatePresence mode="wait">
        {!isExpanded && <MembersAvatarList memberIds={memberIds} variant="large" />}
        {isExpanded && (
          <m.div
            key="expanded"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 48, opacity: 0 }}
            transition={{
              duration: 0.4,
              ease: "easeInOut",
              opacity: { delay: 0.1, duration: 0.3 },
            }}
            style={{ overflow: "hidden" }}
          >
            <MembersDetailView members={members} />
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MembersDetailView({ members }: { members: ProjectMember[] }) {
  const admins = members
    .filter((m) => m.isAdmin || m.isOwner)
    .map((m) => convertProjectMemberToUser(m));
  const displayMembers = members
    .filter((m) => !m.isAdmin && !m.isOwner)
    .map((m) => convertProjectMemberToUser(m));

  console.log("Display members", displayMembers);

  return (
    <div className={styles.membersWrapper}>
      {admins.length > 0 && (
        <div className={styles.content}>
          <MemberTag tag="admin" />
          <div className={styles.members}>
            {admins.map((user) => (
              <MemberCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
      {displayMembers.length > 0 && (
        <div className={styles.content}>
          <MemberTag tag="member" />
          <div className={styles.members}>
            {displayMembers.map((user) => (
              <MemberCard key={user.id} user={user} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
