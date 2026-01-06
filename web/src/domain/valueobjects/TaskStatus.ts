export class TaskStatus {
  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly isDefault: boolean,
    public readonly isResolved: boolean,
  ) {
    if (!name || name.trim().length === 0) {
      throw new Error("Status name cannot be empty");
    }
  }
}
