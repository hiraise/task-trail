import { parseISO } from "date-fns";

import type { TaskComment } from "@/domain/models/TaskComment";
import type { TaskEvent, TaskEventKind } from "@/domain/models/TaskEvent";
import { getUserDisplayName } from "@/domain/models/User";
import type { TaskStatusId } from "@/domain/types";
import { tasksTexts } from "@/shared/locales/tasks";
import { formatDate } from "@/shared/utils/formatters";
import { interpolate } from "@/shared/utils/interpolate";

export type FeedItem =
  | { type: "comment"; id: string; comment: TaskComment }
  | { type: "event"; id: string; event: TaskEvent };

/**
 * One feed of comments and events, newest on top (ADR-0028). Both lists come from the server
 * newest first; with equal time a comment goes above an event.
 */
export function buildFeed(comments: TaskComment[], events: TaskEvent[]): FeedItem[] {
  const out: FeedItem[] = [];
  let c = 0;
  let e = 0;

  while (c < comments.length || e < events.length) {
    const comment = comments[c];
    const event = events[e];

    if (comment && (!event || Date.parse(comment.createdAt) >= Date.parse(event.createdAt))) {
      out.push({ type: "comment", id: `c-${comment.id}`, comment });
      c++;
    } else {
      out.push({ type: "event", id: `e-${event.id}`, event });
      e++;
    }
  }

  return out;
}

type StatusName = (id: TaskStatusId) => string;

const texts = tasksTexts.events;

function describeAssignee({ fromUser, toUser }: TaskEvent): string {
  if (fromUser && toUser) {
    return interpolate(texts.assigneeChanged, {
      from: getUserDisplayName(fromUser),
      to: getUserDisplayName(toUser),
    });
  }

  return toUser
    ? interpolate(texts.assigneeSet, { name: getUserDisplayName(toUser) })
    : texts.assigneeRemoved;
}

// A due date is a calendar day: parseISO reads YYYY-MM-DD as local midnight, new Date() would
// read it as UTC and show the previous day west of Greenwich (ADR-0034).
function describeDueDate({ fromDueDate, toDueDate }: TaskEvent): string {
  const day = (date: string) => formatDate(parseISO(date));

  if (fromDueDate && toDueDate) {
    return interpolate(texts.dueDateChanged, { from: day(fromDueDate), to: day(toDueDate) });
  }

  return toDueDate ? interpolate(texts.dueDateSet, { date: day(toDueDate) }) : texts.dueDateRemoved;
}

const DESCRIBE: Record<TaskEventKind, (event: TaskEvent, statusName: StatusName) => string> = {
  created: () => texts.created,
  edited: () => texts.edited,
  archived: () => texts.archived,
  restored: () => texts.restored,
  status_changed: ({ fromStatusId, toStatusId }, statusName) =>
    interpolate(texts.status, {
      from: fromStatusId ? statusName(fromStatusId) : "",
      to: toStatusId ? statusName(toStatusId) : "",
    }),
  priority_changed: ({ fromPriority, toPriority }) =>
    interpolate(texts.priority, {
      from: fromPriority ? tasksTexts.priorities[fromPriority] : "",
      to: toPriority ? tasksTexts.priorities[toPriority] : "",
    }),
  due_date_changed: describeDueDate,
  moved: ({ fromKey, toKey }) => interpolate(texts.moved, { from: fromKey ?? "", to: toKey ?? "" }),
  assignee_changed: describeAssignee,
};

/** The event line (texts — tasksTexts.events); status names come from the server. */
export function describeEvent(event: TaskEvent, statusName: StatusName): string {
  return DESCRIBE[event.kind](event, statusName);
}
