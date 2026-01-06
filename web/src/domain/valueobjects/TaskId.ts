export class TaskId {
  private constructor(public readonly value: string | number) {
    if (value === null || value === undefined) {
      throw new Error("TaskId cannot be null or undefined");
    }
  }

  static create(value: string | number): TaskId {
    return new TaskId(Number(value));
  }

  equals(other: TaskId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
