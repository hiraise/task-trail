import clsx from "clsx";

import type { AdminUser } from "@/domain/models/AdminUser";
import { UserAvatar } from "@/presentation/shared";
import { useGetCurrentUser } from "@/presentation/shared/hooks";
import { adminTexts } from "@/shared/locales/admin";

import { StatusTag } from "../StatusTag";

import styles from "./UserSummary.module.css";

/** Avatar, name with the "you" and "Administrator" tags, and email; without a name, only the email. */
export function UserSummary({ user }: { user: AdminUser }) {
  const { data: currentUser } = useGetCurrentUser();
  const name = user.username?.trim();
  const title = name || user.email;

  return (
    <div className={styles.user}>
      <UserAvatar variant="large" src={user.avatarUrl} name={title} />
      <div className={styles.text}>
        <div className={styles.nameRow}>
          <span className={clsx("body-med", styles.name)}>{title}</span>
          {user.id === currentUser?.id && (
            <span className={clsx("body-reg-2", styles.secondary)}>{adminTexts.users.you}</span>
          )}
          {user.isAdmin && <StatusTag tone="admin">{adminTexts.users.admin}</StatusTag>}
        </div>
        {name && <span className={clsx("body-reg-2", styles.secondary)}>{user.email}</span>}
      </div>
    </div>
  );
}
