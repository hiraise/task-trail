export interface ApiProject {
  id: string | number;
  name: string;
  description?: string;
  totalTasks?: number;
}

// export interface ApiUser {
//   id: string | number;
//   username?: string;
//   email: string;
//   avatarUrl?: string;
// }

// export interface ApiResponse<T> {
//   data: T;
//   success: boolean;
//   message?: string;
// }

// export interface ApiError {
//   message: string;
//   code?: string;
//   details?: unknown;
// }
