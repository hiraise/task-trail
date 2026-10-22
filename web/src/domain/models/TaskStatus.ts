import type { TaskStatusId } from "../types";

/** Статус задачи из общего набора (ADR-0003). */
export interface TaskStatus {
  id: TaskStatusId;
  /** Название для интерфейса */
  name: string;
  /** Статус новой задачи */
  isDefault: boolean;
  /** Задача выполнена */
  isResolved: boolean;
}
