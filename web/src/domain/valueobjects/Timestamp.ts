export class Timestamp {
  private constructor(private readonly date: Date) {
    if (!(date instanceof Date) || isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
  }

  static now(): Timestamp {
    return new Timestamp(new Date());
  }

  static fromString(dateString: string): Timestamp {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date string: ${dateString}`);
    }
    return new Timestamp(date);
  }

  static fromDate(date: Date): Timestamp {
    return new Timestamp(date);
  }

  getDate(): Date {
    return new Date(this.date);
  }

  toISOString(): string {
    return this.date.toISOString();
  }

  toString(): string {
    return this.date.toLocaleString();
  }

  toLocaleDateString(): string {
    return this.date.toLocaleDateString();
  }

  equals(other: Timestamp): boolean {
    return this.date.getTime() === other.date.getTime();
  }
}
