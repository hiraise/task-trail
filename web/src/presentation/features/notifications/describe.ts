import { parseISO } from "date-fns";

import type { Notification } from "@/domain/models/Notification";
import { getUserDisplayName } from "@/domain/models/User";
import type { TaskStatusId } from "@/domain/types";
import { notificationsTexts } from "@/shared/locales/notifications";
import { formatDate } from "@/shared/utils/formatters";
import { interpolate } from "@/shared/utils/interpolate";

/** The display name of a status: from `useTaskStatuses`, the id until they load. */
export type StatusName = (id: TaskStatusId) => string;

/**
 * The sentence split for the row: `actor` is shown in bold, `rest` follows it. Reminders have
 * no actor. Every template starts with `{actor}` (notificationsTexts.kinds).
 */
export function notificationParts(
  n: Notification,
  statusName: StatusName,
): { actor?: string; rest: string } {
  const template = notificationsTexts.kinds[n.kind];
  const actor = n.actor ? getUserDisplayName(n.actor) : undefined;
  const rest = interpolate(template, {
    actor: "",
    from: n.fromStatusId ? statusName(n.fromStatusId) : "",
    to: n.toStatusId ? statusName(n.toStatusId) : "",
    // A calendar day: parseISO keeps it local, new Date would shift it by the time zone
    date: n.dueDate ? formatDate(parseISO(n.dueDate)) : "",
  });

  return actor === undefined ? { rest } : { actor, rest };
}

/** The whole sentence of a notification. */
export function describeNotification(n: Notification, statusName: StatusName): string {
  const { actor, rest } = notificationParts(n, statusName);

  return `${actor ?? ""}${rest}`;
}
