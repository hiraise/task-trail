import type { ProjectId, TaskId } from "../types";

export class TaskCreationDraft {
  private id: TaskId;
  private name: string = "";
  private description: string = "";
  private projectId: ProjectId | null = null;
  private assigneeId: string | null = null;

  constructor(id?: string) {
    this.id = id || "";
  }

  // ===== Getters =====

  getId(): TaskId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getProjectId(): ProjectId | null {
    return this.projectId;
  }

  getAssigneeId(): string | null {
    return this.assigneeId;
  }

  // ===== Setters =====

  setName(name: string): void {
    this.name = name.trim();
  }

  setDescription(description: string): void {
    this.description = description || "";
  }

  setAssigneeId(assigneeId: string | number | null): void {
    this.assigneeId = String(assigneeId);
  }

  setProjectById(projectId: string | number): void {
    this.projectId = String(projectId);
  }

  // ===== Validation =====

  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length < 3) {
      errors.push("Task name must be at least 3 characters");
    }

    if (this.name.length > 100) {
      errors.push("Task name must not exceed 100 characters");
    }

    if (this.description.length > 1000) {
      errors.push("Description must not exceed 1000 characters");
    }

    if (!this.projectId) {
      errors.push("Project is required");
    }

    if (!this.assigneeId) {
      errors.push("Assignee is required");
    }

    return errors;
  }

  // ===== Persistence =====

  toPersistenceDto() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return {
      name: this.name,
      description: this.description,
      projectId: this.projectId ? this.projectId : "",
      assigneeId: this.assigneeId ? this.assigneeId : undefined,
    };
  }

  // ===== Utility =====

  clear(): void {
    this.name = "";
    this.description = "";
    this.projectId = null;
    this.assigneeId = null;
  }
}
