export class UserId {
  private constructor(public readonly value: string | number) {
    if (value === null || value === undefined) {
      throw new Error("UserId cannot be null or undefined");
    }
  }

  static create(value: string | number): UserId {
    return new UserId(Number(value));
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return String(this.value);
  }
}
