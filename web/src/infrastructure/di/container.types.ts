import type * as authUC from "@/application/usecases/auth/";
import type * as projectUC from "@/application/usecases/project/";
import type * as projectMemberUC from "@/application/usecases/projectMember";
import type * as taskUC from "@/application/usecases/task/";
import type * as userUC from "@/application/usecases/user";
import type { HttpClient } from "@/infrastructure/http/HttpClient";
import type * as repo from "@/infrastructure/repositories/";

export interface DIContainer {
  repositories: RepositoriesContainer;
  usecases: UseCasesContainer;
}

export interface RepositoriesContainer {
  project: repo.ApiProjectRepository;
  projectMember: repo.ApiProjectMemberRepository;
  task: repo.ApiTaskRepository;
  user: repo.ApiUserRepository;
  auth: repo.ApiAuthRepository;
}

export interface UseCasesContainer {
  project: {
    getProject: projectUC.GetProjectUseCase;
    createProject: projectUC.CreateProjectUseCase;
    editProject: projectUC.EditProjectUseCase;
    deleteProject: projectUC.DeleteProjectUseCase;
    getProjectStatuses: projectUC.GetProjectStatusesUseCase;
    getProjectDetail: projectUC.GetProjectDetailUseCase;
  };
  projectMember: {
    leaveProject: projectMemberUC.LeaveProjectUseCase;
    removeMember: projectMemberUC.RemoveProjectMemberUseCase;
    addMember: projectMemberUC.AddProjectMembersUseCase;
  };
  tasks: {
    getProjectTasks: taskUC.GetProjectTasksUseCase;
    getCurrentUserTasks: taskUC.GetCurrentUserTasksUseCase;
    getTaskDetail: taskUC.GetTaskDetailUseCase;
    getTask: taskUC.GetTaskUseCase;
    createTask: taskUC.CreateTaskUseCase;
    selectProject: taskUC.SelectProjectForTaskUseCase;
    editTask: taskUC.EditTaskUseCase;
    deleteTask: taskUC.DeleteTaskUseCase;
    changeAssignee: taskUC.ChangeAssigneeUseCase;
    changeStatus: taskUC.ChangeStatusUseCase;
  };
  auth: {
    login: authUC.LoginUseCase;
    signUp: authUC.SignUpUseCase;
    checkAuthStatus: authUC.CheckAuthStatusUseCase;
    changePassword: authUC.ChangePasswordUseCase;
    recoveryPassword: authUC.RecoveryPasswordUseCase;
    resetPassword: authUC.ResetPasswordUseCase;
    resendEmailVerification: authUC.ResendEmailVerificationUseCase;
    verifyEmail: authUC.VerifyEmailUseCase;
  };
  user: {
    getCurrentUser: userUC.GetCurrentUserUseCase;
    uploadAvatar: userUC.UploadAvatarUseCase;
    updateUser: userUC.UpdateUserUseCase;
  };
}

export interface DIContainerConfig {
  httpClient?: HttpClient;
  repositories?: Partial<RepositoriesContainer>;
}
