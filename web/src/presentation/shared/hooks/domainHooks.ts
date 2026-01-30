/**
 * Domain hooks re-exports for shared usage across the application.
 *
 * This file serves as a centralized point for exposing domain-specific hooks
 * to be used across different domains while maintaining clean architecture.
 *
 * Each export is a re-export from the appropriate domain layer.
 */

// Auth domain hooks
export { useChangePassword, useLogout } from "@/presentation/features/auth/hooks";

// User domain hooks
export { useGetCurrentUser } from "@/presentation/features/user/hooks";

// Project domain hooks
export {
  useProjectMembers,
  useProjects,
  useProjectStatuses,
} from "@/presentation/features/projects/hooks";

// Task domain hooks
export { useGetProjectTasks } from "@/presentation/features/tasks/hooks";

// Add more domain hooks as needed...
