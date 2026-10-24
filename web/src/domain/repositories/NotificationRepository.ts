import type { Notification } from "../models/Notification";

// Notifications of the current user (ADR-0038).
export interface NotificationRepository {
  /** The newest 100, newest first */
  findAll(): Promise<Notification[]>;
  countUnread(): Promise<number>;
  setRead(id: string, read: boolean): Promise<Notification>;
  readAll(): Promise<void>;
}
