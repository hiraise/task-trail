import { UserId } from "../valueobjects/UserId";

export class User {
  private constructor(
    public readonly id: UserId,
    public readonly avatarUrl: string | undefined,
    public readonly username: string | undefined,
    public readonly email: string
  ) {}

  static fromBackendData(
    id: string | number,
    avatarUrl: string | undefined,
    username: string | undefined,
    email: string
  ): User {
    return new User(UserId.create(id), avatarUrl, username, email);
  }

  getDisplayName(): string {
    if (this.username && this.username.trim()) return this.username;
    if (this.email) return this.email.split("@")[0];
    return "";
  }

  equals(other: User): boolean {
    return this.id.equals(other.id);
  }

  toString(): string {
    return `User(id=${this.id.value}, email=${this.email}, username=${this.username})`;
  }
}
