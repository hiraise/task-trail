# Step 14 — notifications in the web

Read first: [ADR-0038](../../adr/0038-notifications.md), [ADR-0008](../../adr/0008-web-architecture.md), the
stage [README](README.md), artboard F and «Approved values» in [00-mockups.md](00-mockups.md). Steps 12 and
13 must be merged. Names marked *(new)* do not exist yet.

## Model, mapper, repository

- `web/src/domain/models/Notification.ts` *(new)*:

  ```ts
  export type NotificationKind = "assigned" | "status_changed" | "commented" | "mentioned" | "due_soon" | "overdue";
  export interface Notification {
    id: string;
    kind: NotificationKind;
    task: { id: TaskId; key: string; name: string };
    actor?: User;
    createdAt: string;
    readAt?: string;
    fromStatusId?: TaskStatusId;
    toStatusId?: TaskStatusId;
    text?: string;
    dueDate?: string; // YYYY-MM-DD
  }
  ```

- `CurrentUser.emailNotifications: boolean` in `domain/models/User.ts` and its mapper; add it to the
  `dto` of `describe("toCurrentUser")` in `mappers.test.ts`.
- `toNotification` *(new)* in `mappers.ts` with tests.
- `NotificationRepository` *(new)* — `findAll()`, `countUnread(): Promise<number>`, `setRead(id, read):
  Promise<Notification>`, `readAll()`; `apiNotificationRepository.ts`; routes `NOTIFICATIONS`,
  `NOTIFICATIONS_UNREAD_COUNT`, `NOTIFICATION(id)`, `NOTIFICATIONS_READ_ALL`.
- `UserRepository.setEmailNotifications(enabled): Promise<CurrentUser>` *(new)*, route
  `USERS_ME_EMAIL_NOTIFICATIONS`.
- `QUERY_KEYS.notification = { all: ["notification"], list: ["notification", "list"], unread:
  ["notification", "unread"] }`.

## Texts — `shared/locales/notifications.ts` *(new)*

`notificationsTexts`: `title: "Уведомления"`, `readAll: "Прочитать все"`, `empty: "Уведомлений пока
нет"`, `loadFailed: "Не удалось загрузить уведомления"`, `kinds`:
- `assigned: "{actor} назначил(а) вас ответственным"`,
- `status_changed: "{actor} изменил(а) статус: {from} → {to}"`,
- `commented: "{actor} оставил(а) комментарий"`,
- `mentioned: "{actor} упомянул(а) вас"`,
- `due_soon: "Срок завтра, {date}"`, `overdue: "Срок прошёл {date}"`;
`emailSwitch: "Письма об уведомлениях"`, `emailHint: "Письмо придёт, если уведомление не прочитано
5 минут"`, `mailDisabled: "Почта не подключена администратором — письма не приходят"`,
`emailSaveFailed: "Не удалось сохранить настройку"`.
`TEXTS.drawer.notifications: "Уведомления"`, `TEXTS.navBar.notifications: "Уведомления"`.

## Icons and tokens

`ICONS.bell` and the counter badge tokens from «Approved values».

## Feature `notifications` *(new)* — `web/src/presentation/features/notifications/`

- Hooks:
  - `useUnreadNotifications()` — `useQuery` with `notification.unread`, `refetchInterval: 60_000`,
    `refetchIntervalInBackground: false` (polling only in a visible tab, ADR-0038);
  - `useNotifications()` — `notification.list`, `staleTime: 0`;
  - `useSetNotificationRead()`, `useReadAllNotifications()` — invalidate `notification.all`.
- `describeNotification(n, statusName): string` *(new)* in `features/notifications/describe.ts` — fills
  `notificationsTexts.kinds` with `interpolate`: `actor` — `getUserDisplayName`, statuses — names from
  `useTaskStatuses` passed in, `date` — `formatDate(parseISO(dueDate))`. Test every kind in
  `describe.test.ts`.
- `NotificationItem` *(new)*: the actor's `UserAvatar` (for reminders — `ICONS.calendar` in a circle),
  the text from `describeNotification`, `text` (the comment start) in `body-reg-2` gray for
  `commented`/`mentioned`, «DS-12 · Название» in `caption-reg`, the time (`formatDateTime`), an unread
  dot (`--icon-accent`). A click: `setRead(true)` if unread, then navigate to `/tasks/$taskId`.
- `NotificationsPage` *(new)* in `pages/NotificationsPage/` — one adaptive page (no `*Mobile`/`*Desktop`
  files): the title «Уведомления» and «Прочитать все» (`SubmitButton text`, disabled without unread);
  the list; empty — `EmptyListState` (it requires `src` and `alt`: use the image approved in step 0, or
  `ASSETS.images.task` if none was drawn, with `alt` = `notificationsTexts.empty`); loading — `aria-busy`
  placeholders;
  an error — `loadFailed`. On a phone it is a section screen with `BottomNavBar` (see below); wider — a
  card in `DesktopTemplate`, like `TasksPage`. Test: the empty state; «Прочитать все» calls the mutation.
- Route `web/src/routes/_main/notifications/index.tsx` *(new)* —
  `createFileRoute("/_main/notifications/")({ component: NotificationsPage })`;
  `ROUTES.notifications = "/notifications"` in `shared/config/routes.ts`; add it to `BOTTOM_NAV_PATHS`
  so the phone bar shows on the page. `routeTree.gen.ts` regenerates on `npm run build`/`dev` — commit it.

## The bell

- `UnreadBadge` *(new)* — `presentation/shared/components/UnreadBadge/`: props `{ count: number }`;
  nothing for 0; «99+» above 99; tokens from «Approved values»; `aria-label` «{count} непрочитанных».
  Shared components may not use feature hooks, so the count comes as a prop; re-export
  `useUnreadNotifications` from `presentation/shared/hooks/domainHooks.ts` for the layout.
- `Drawer` (`presentation/shared/components/Layout/Drawer/`): a `notificationsItem = { href:
  ROUTES.notifications, icon: ICONS.bell, label: TEXTS.drawer.notifications }` after `searchItem` under
  the divider; `NavMenuItem` and `NavItem` get an optional `badge?: number` rendered as `UnreadBadge`
  next to the label (expanded) or on the icon corner (collapsed).
- `BottomNavBar`: a round link to `ROUTES.notifications` with `ICONS.bell` next to the search link (same
  style), with `UnreadBadge` on its corner.
- `docs/design-system.md`: `UnreadBadge`, the bell in the layout section.

## The email switch — profile

- `useSetEmailNotifications()` *(new)* in `features/user/hooks/` — `userRepository.setEmailNotifications`,
  `setQueryData(QUERY_KEYS.user.current, user)`, `toastError(error, emailSaveFailed)`.
- `EmailNotificationsSwitch` *(new)* in `features/user/components/`: a `<label>` row with the `CheckBox`
  (`aria-label` from step 6) and `notificationsTexts.emailSwitch`, `emailHint` under it; when `usePublicSettings().data?.mailEnabled` is
  false — `mailDisabled` in `--text-secondary` instead of the hint (the switch still works: the choice
  applies once mail is connected).
- `ProfilePage`: render it once, outside `.menu` and `.forms`, so it shows on every width — on a phone
  above the logout button, wider — as a third block under the password form (follow artboard F). Blocks
  outside `.menu`/`.forms` get no padding: give it its own (`0 20px` on a phone, `0 24px 24px` from
  768 px — the same as `.menu` and `.forms`).

## Stack

On the stack with two users: assign a task, change a status, comment — the counter grows within a minute
on the other user's drawer or phone bar; open the list, click an item (opens the task, the dot goes),
«Прочитать все»; switch emails off in the profile; with mail in Mailpit — an email after 5 minutes.

## Done when

Common criteria from the stage README; `describeNotification` is tested for all kinds.

## Show the customer

The bell with the counter on a phone and a desktop (expanded and collapsed drawer), the notifications
page with each kind, reading, «Прочитать все», the profile switch with and without mail.
