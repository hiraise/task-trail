import { ProjectId } from "../valueobjects/ProjectId";
import { TaskId } from "../valueobjects/TaskId";
import { Timestamp } from "../valueobjects/Timestamp";

export class Task {
  private constructor(
    public readonly id: TaskId,
    public title: string,
    public description: string | undefined,
    public readonly statusId: number,
    public readonly createdAt: Timestamp,
    public readonly updatedAt: Timestamp,
    public readonly projectId: ProjectId,
    public readonly authorId: number,
    public readonly assigneeId?: number,
  ) {}

  static fromBackendData(
    id: string | number,
    title: string,
    description: string | undefined,
    statusId: number,
    createdAt: string,
    updatedAt: string,
    projectId: string | number,
    authorId: number,
    assigneeId: number | undefined,
  ): Task {
    return new Task(
      TaskId.create(id),
      title,
      description,
      statusId,
      Timestamp.fromString(createdAt),
      Timestamp.fromString(updatedAt),
      ProjectId.create(projectId),
      authorId,
      assigneeId,
    );
  }
}
