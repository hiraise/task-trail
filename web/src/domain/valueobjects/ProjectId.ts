export class ProjectId {
  private constructor(public readonly value: string | number) {
    if (value === null || value === undefined) {
      throw new Error("ProjectId cannot be null or undefined");
    }
  }

  static create(value: string | number): ProjectId {
    return new ProjectId(Number(value));
  }

  equals(other: ProjectId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
