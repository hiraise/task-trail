import type { ProjectId } from "../types";

export class ProjectCreationDraft {
  private id: ProjectId;
  private name: string = "";
  private description: string = "";
  private emails: string[] = [];

  constructor(id?: string) {
    this.id = id ?? ("" as ProjectId);
  }

  // ===== Getters =====

  getId(): ProjectId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getDescription(): string {
    return this.description;
  }

  getMembers(): string[] {
    return [...this.emails];
  }

  // ===== Setters =====

  setName(name: string): void {
    this.name = name.trim();
  }

  setDescription(description: string): void {
    this.description = description || "";
  }

  setMembers(emails: string[]): void {
    this.emails = [];
    emails.forEach((email) => {
      this.addMemberByEmail(email);
    });
  }

  // ===== Member operations =====

  addMemberByEmail(email: string): void {
    if (this.emails.some((e) => e.toString().toLowerCase() === email.toLowerCase())) {
      throw new Error("Member with this email already exists");
    }
    this.emails.push(email);
  }

  removeMember(email: string): void {
    this.emails = this.emails.filter((e) => e.toString().toLowerCase() !== email.toLowerCase());
  }

  toggleMember(email: string): void {
    if (this.emails.some((e) => e.toString().toLowerCase() === email.toLowerCase())) {
      this.removeMember(email);
    } else {
      this.addMemberByEmail(email);
    }
  }

  // ===== Validation =====

  validate(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length < 3) {
      errors.push("Project name must be at least 3 characters");
    }

    if (this.name.length > 100) {
      errors.push("Project name must not exceed 100 characters");
    }

    if (this.description.length > 1000) {
      errors.push("Description must not exceed 1000 characters");
    }

    return errors;
  }

  isEmpty(): boolean {
    return !this.name && !this.description && this.emails.length === 0;
  }

  // ===== Persistence =====

  /**
   * Преобразование в DTO для отправки на бек
   * Бек вернет Project с пермиссионами
   */
  toPersistenceDto() {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(", ")}`);
    }

    return {
      name: this.name,
      description: this.description,
      participants: this.emails.map((e) => e.toString()),
    };
  }

  // ===== Utility =====

  clear(): void {
    this.name = "";
    this.description = "";
    this.emails = [];
  }
}
