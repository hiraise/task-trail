import type { NotificationRepository } from "@/domain/repositories/NotificationRepository";

import type {
  Notification,
  SetNotificationReadRequest,
  UnreadNotifications,
} from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toNotification } from "./mappers";

const createNotificationRepository = (http: HttpClient): NotificationRepository => ({
  findAll: async () =>
    (await http.get<Notification[]>(API_ROUTES.NOTIFICATIONS)).map(toNotification),

  countUnread: async () =>
    (await http.get<UnreadNotifications>(API_ROUTES.NOTIFICATIONS_UNREAD_COUNT)).count,

  setRead: async (id, read) => {
    const body: SetNotificationReadRequest = { read };

    return toNotification(await http.patch<Notification>(API_ROUTES.NOTIFICATION(id), body));
  },

  readAll: async () => {
    await http.post(API_ROUTES.NOTIFICATIONS_READ_ALL);
  },
});

export const notificationRepository: NotificationRepository =
  createNotificationRepository(axiosClient);
