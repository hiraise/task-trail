export class Email {
  private constructor(private readonly value: string) {
    if (!this.isValidEmail(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
  }

  static create(email: string): Email {
    return new Email(email.toLowerCase().trim());
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
