export interface ApiProject {
  id: number;
  name: string;
  description?: string;
  totalTasks?: number;
}

export interface ApiProjectMembers {
  emails: string[];
}
