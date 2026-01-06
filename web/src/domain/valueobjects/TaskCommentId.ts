export class TaskCommentId {
  private constructor(public readonly value: string | number) {
    if (value === null || value === undefined) {
      throw new Error("TaskCommentId cannot be null or undefined");
    }
  }

  static create(value: string | number): TaskCommentId {
    return new TaskCommentId(Number(value));
  }

  equals(other: TaskCommentId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
