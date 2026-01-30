import * as uc from "@/application/usecases/";
import type { HttpClient } from "@/infrastructure/http/HttpClient";
import * as repo from "@/infrastructure/repositories/";

import { validateEnvironment } from "../config/environment";
import axiosClient from "../http/axiosClient";

import type {
  DIContainer,
  DIContainerConfig,
  RepositoriesContainer,
  UseCasesContainer,
} from "./container.types";

validateEnvironment();

export const createAppContainer = (config?: DIContainerConfig): DIContainer => {
  const httpClient: HttpClient = config?.httpClient ?? axiosClient;

  // === Repositories ===
  const defaultRepositories = {
    project: repo.createProjectRepository(httpClient),
    projectMember: repo.createProjectMemberRepository(httpClient),
    task: repo.createTaskRepository(httpClient),
    user: repo.createUserRepository(httpClient),
    auth: repo.createAuthRepository(httpClient),
  };

  const repositories: RepositoriesContainer = config?.repositories
    ? { ...defaultRepositories, ...config.repositories }
    : defaultRepositories;

  // === Use Cases  ===
  const getCurrentUser = uc.createGetCurrentUserUseCase(repositories.user);

  const usecases: UseCasesContainer = {
    project: {
      getProject: uc.createGetProjectUseCase(repositories.project),
      createProject: uc.createCreateProjectUseCase(repositories.project),
      editProject: uc.createEditProjectUseCase(repositories.project),
      deleteProject: uc.createDeleteProjectUseCase(repositories.project),
      getProjectStatuses: uc.createGetProjectStatusesUseCase(repositories.project),
      getProjectDetail: uc.createGetProjectDetailUseCase(
        repositories.project,
        repositories.projectMember,
        repositories.task,
      ),
    },
    projectMember: {
      leaveProject: uc.createLeaveProjectUseCase(repositories.projectMember),
      removeMember: uc.createRemoveProjectMemberUseCase(
        repositories.projectMember,
        repositories.project,
      ),
      addMember: uc.createAddProjectMembersUseCase(
        repositories.projectMember,
        repositories.project,
      ),
    },
    tasks: {
      getProjectTasks: uc.createGetProjectTasksUseCase(repositories.task),
      getCurrentUserTasks: uc.createGetCurrentUserTasksUseCase(repositories.task),
      getTaskDetail: uc.createGetTaskDetailUseCase(
        repositories.task,
        repositories.user,
        repositories.project,
      ),
      getTask: uc.createGetTaskUseCase(repositories.task),
      createTask: uc.createCreateTaskUseCase(repositories.task),
      selectProject: uc.createSelectProjectForTaskUseCase(repositories.projectMember),
      editTask: uc.createEditTaskUseCase(repositories.task),
      deleteTask: uc.createDeleteTaskUseCase(repositories.task),
      changeAssignee: uc.createChangeAssigneeUseCase(repositories.task, repositories.user),
      changeStatus: uc.createChangeStatusUseCase(repositories.task, repositories.project),
    },
    auth: {
      login: uc.createLoginUseCase(repositories.auth),
      signUp: uc.createSignUpUseCase(repositories.auth),
      checkAuthStatus: uc.createCheckAuthStatusUseCase(repositories.auth, getCurrentUser),
      changePassword: uc.createChangePasswordUseCase(repositories.auth),
      recoveryPassword: uc.createRecoveryPasswordUseCase(repositories.auth),
      resetPassword: uc.createResetPasswordUseCase(repositories.auth),
      resendEmailVerification: uc.createResendEmailVerificationUseCase(repositories.auth),
      verifyEmail: uc.createVerifyEmailUseCase(repositories.auth),
    },
    user: {
      getCurrentUser: getCurrentUser,
      uploadAvatar: uc.createUploadAvatarUseCase(repositories.user),
      updateUser: uc.createUpdateUserUseCase(repositories.user),
    },
  };
  return {
    repositories,
    usecases,
  };
};

export const appContainer = createAppContainer();
