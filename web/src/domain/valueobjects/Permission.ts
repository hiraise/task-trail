export class Permission {
  private constructor(private readonly value: string) {}

  static readonly PROJECT_INVITE_USERS = new Permission("PROJECT_INVITE_USERS");
  static readonly PROJECT_KICK_USERS = new Permission("PROJECT_KICK_USERS");
  static readonly PROJECT_SET_ROLES = new Permission("PROJECT_SET_ROLES");
  static readonly PROJECT_EDIT = new Permission("PROJECT_EDIT");
  static readonly PROJECT_ARCHIVE = new Permission("PROJECT_ARCHIVE");
  static readonly PROJECT_DELETE = new Permission("PROJECT_DELETE");
  static readonly PROJECT_DELETE_TASK = new Permission("PROJECT_DELETE_TASK");
  static readonly PROJECT_GET_CANDIDATES = new Permission("PROJECT_GET_CANDIDATES");
  static readonly PROJECT_OWNER = new Permission("PROJECT_OWNER");
  static readonly PROJECT_ADMIN = new Permission("PROJECT_ADMIN");
  static readonly PROJECT_UPDATE_TASK = new Permission("PROJECT_UPDATE_TASK");
  static readonly PROJECT_CREATE_TASK = new Permission("PROJECT_CREATE_TASK");

  static fromString(value: string): Permission {
    const allPermissions = [
      Permission.PROJECT_INVITE_USERS,
      Permission.PROJECT_KICK_USERS,
      Permission.PROJECT_SET_ROLES,
      Permission.PROJECT_EDIT,
      Permission.PROJECT_ARCHIVE,
      Permission.PROJECT_DELETE,
      Permission.PROJECT_DELETE_TASK,
      Permission.PROJECT_GET_CANDIDATES,
      Permission.PROJECT_OWNER,
      Permission.PROJECT_ADMIN,
      Permission.PROJECT_UPDATE_TASK,
      Permission.PROJECT_CREATE_TASK,
    ];

    const permission = allPermissions.find((p) => p.value === value);
    if (!permission) {
      throw new Error(`Invalid permission: ${value}`);
    }
    return permission;
  }

  toString(): string {
    return this.value;
  }

  equals(other: Permission): boolean {
    return this.value === other.value;
  }
}
