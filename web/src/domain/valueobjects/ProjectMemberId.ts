export class ProjectMemberId {
  private constructor(public readonly value: number) {
    if (!value || value <= 0) {
      throw new Error("ProjectMemberId must be a positive number");
    }
  }

  static create(value: number | string): ProjectMemberId {
    const numValue = typeof value === "string" ? parseInt(value, 10) : value;
    return new ProjectMemberId(numValue);
  }

  equals(other: ProjectMemberId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
