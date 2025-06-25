export interface User {
  id: string;
  email: string;
  name: string;
}

export type GetCurrentUser = () => Promise<User | null>;
