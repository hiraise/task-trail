export class BoardId {
  constructor(public readonly value: number) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("BoardId must be a positive integer");
    }
  }

  equals(other: BoardId): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value.toString();
  }

  static fromNumber(value: number): BoardId {
    return new BoardId(value);
  }
}
