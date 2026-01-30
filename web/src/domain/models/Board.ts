import { DomainError } from "@/shared/errors/types";

import type { BoardId } from "../types";

import type { User } from "./User";

export class Board {
  constructor(
    public readonly id: BoardId,
    public name: string,
    public taskCount: number,
    public readonly members: User[],
  ) {
    this.validate();
  }

  rename(newName: string): void {
    if (!newName || newName.trim().length === 0) {
      throw new DomainError("Board name cannot be empty");
    }

    if (newName.trim().length > 100) {
      throw new DomainError("Board name too long (max 100 characters)");
    }

    this.name = newName.trim();
  }

  addMember(user: User): void {
    if (this.members.some((member) => member.id === user.id)) {
      throw new DomainError("User is already a member of this board");
    }

    this.members.push(user);
  }

  removeMember(userId: User["id"]): void {
    const memberIndex = this.members.findIndex((member) => member.id === userId);

    if (memberIndex === -1) {
      throw new DomainError("User is not a member of this board");
    }

    if (this.members.length <= 1) {
      throw new DomainError("Board must have at least one member");
    }

    this.members.splice(memberIndex, 1);
  }

  isMember(userId: User["id"]): boolean {
    return this.members.some((member) => member.id === userId);
  }

  updateTaskCount(count: number): void {
    if (count < 0) {
      throw new DomainError("Task count cannot be negative");
    }

    this.taskCount = count;
  }

  private validate(): void {
    if (!this.name || this.name.trim().length === 0) {
      throw new DomainError("Board must have a name");
    }

    if (this.members.length === 0) {
      throw new DomainError("Board must have at least one member");
    }

    if (this.taskCount < 0) {
      throw new DomainError("Task count cannot be negative");
    }
  }
}
