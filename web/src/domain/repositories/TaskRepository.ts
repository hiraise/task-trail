import type { Attachment } from "../models/Attachment";
import type { Task } from "../models/Task";
import type { TaskComment } from "../models/TaskComment";
import type { TaskEvent } from "../models/TaskEvent";
import type { TaskStatus } from "../models/TaskStatus";
import type { CommentId, LabelId, ProjectId, TaskId, TaskPriorityId, TaskStatusId, UserId } from "../types";

export interface NewTask {
  projectId: ProjectId;
  name: string;
  description?: string;
  /** The assignee is a project member */
  assigneeId?: UserId;
  /** undefined — the default status; a task from a board column starts in that column (ADR-0029) */
  statusId?: TaskStatusId;
  /** undefined — `normal` (ADR-0033) */
  priority?: TaskPriorityId;
  /** YYYY-MM-DD; undefined — no due date (ADR-0034) */
  dueDate?: string;
  /** Creates a subtask of this task: same project, not itself a subtask (ADR-0036) */
  parentId?: TaskId;
}

export interface TaskChanges {
  name?: string;
  /** null removes the description */
  description?: string | null;
}

// Each task operation has its own method and endpoint (ADR-0002); the server responds with the task.
export interface TaskRepository {
  findById(id: TaskId): Promise<Task>;
  /** The project's tasks by their own archive flag (ADR-0027) */
  findByProjectId(projectId: ProjectId, archived: boolean): Promise<Task[]>;
  /**
   * Tasks assigned to the current user across all their projects. Active: neither the task nor its
   * project is archived; archived: either is (ADR-0027).
   */
  findAssignedToMe(archived: boolean): Promise<Task[]>;
  /** Statuses in workflow order */
  findStatuses(): Promise<TaskStatus[]>;
  create(task: NewTask): Promise<Task>;
  update(id: TaskId, changes: TaskChanges): Promise<Task>;
  changeStatus(id: TaskId, statusId: TaskStatusId): Promise<Task>;
  changePriority(id: TaskId, priority: TaskPriorityId): Promise<Task>;
  /** YYYY-MM-DD; null removes the due date (ADR-0034) */
  changeDueDate(id: TaskId, dueDate: string | null): Promise<Task>;
  /** null unassigns the task */
  changeAssignee(id: TaskId, assigneeId: UserId | null): Promise<Task>;
  /** Replaces the task's labels: 0–10 labels of its project (ADR-0035) */
  setLabels(id: TaskId, labelIds: LabelId[]): Promise<Task>;
  /** Moves to another project; if the assignee is not a member of the new project, the task is unassigned */
  move(id: TaskId, projectId: ProjectId): Promise<Task>;
  /** Archives (true) or restores (false) a task; any member of its active project */
  setArchived(id: TaskId, archived: boolean): Promise<Task>;
  delete(id: TaskId): Promise<void>;
  /** The task's subtasks in number order, archived ones included (ADR-0036) */
  findSubtasks(id: TaskId): Promise<Task[]>;
  /** Attaches the task to a parent of the same project; null detaches it; any member (ADR-0036) */
  changeParent(id: TaskId, parentId: TaskId | null): Promise<Task>;
  /** The task feed (ADR-0028): comments, newest first */
  findComments(taskId: TaskId): Promise<TaskComment[]>;
  /** The server trims the text; neither the task nor its project is archived */
  createComment(taskId: TaskId, text: string): Promise<TaskComment>;
  /** Only the author, during the first 24 hours */
  updateComment(taskId: TaskId, commentId: CommentId, text: string): Promise<TaskComment>;
  /** The author, the project owner or a project admin */
  deleteComment(taskId: TaskId, commentId: CommentId): Promise<void>;
  /** The task change history, newest first */
  findEvents(taskId: TaskId): Promise<TaskEvent[]>;
  /** The task's attachments, newest first; any member of its project (ADR-0037) */
  findAttachments(id: TaskId): Promise<Attachment[]>;
  /** Any type up to 25 MB; neither the task nor its project is archived */
  uploadAttachment(id: TaskId, file: File): Promise<Attachment>;
  /** The uploader, the project owner or a project admin */
  deleteAttachment(id: TaskId, fileId: string): Promise<void>;
}
