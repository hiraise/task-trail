import * as authUC from "@/application/usecases/auth/";
import * as projectUC from "@/application/usecases/project/";
import * as projectMemberUC from "@/application/usecases/projectMember";
import * as taskUC from "@/application/usecases/task/";
import * as userUC from "@/application/usecases/user";
import type { HttpClient } from "@/infrastructure/http/HttpClient";
import * as repo from "@/infrastructure/repositories/";

import { validateEnvironment } from "../config/environment";
import axiosClient from "../http/axiosClient";

import type {
  DIContainerConfig,
  RepositoriesContainer,
  UseCasesContainer,
} from "./container.types";

validateEnvironment();

export class DIContainer {
  private readonly repositories: RepositoriesContainer;
  private readonly usecases: UseCasesContainer;
  private readonly http: { client: HttpClient };

  constructor(config?: DIContainerConfig) {
    const httpClient: HttpClient = config?.httpClient ?? axiosClient;

    // Initialize repositories
    this.repositories = config?.repositories
      ? { ...this.createDefaultRepositories(httpClient), ...config.repositories }
      : this.createDefaultRepositories(httpClient);

    // Initialize use cases
    this.usecases = this.createUseCases();

    // Configuration
    this.http = { client: httpClient };
  }

  private createDefaultRepositories(httpClient: HttpClient): RepositoriesContainer {
    return {
      project: new repo.ApiProjectRepository(httpClient),
      projectMember: new repo.ApiProjectMemberRepository(httpClient),
      task: new repo.ApiTaskRepository(httpClient),
      user: new repo.ApiUserRepository(httpClient),
      auth: new repo.ApiAuthRepository(httpClient),
    };
  }

  private createUseCases(): UseCasesContainer {
    const { project, projectMember, task, user, auth } = this.repositories;

    return {
      project: {
        getProjects: new projectUC.GetProjectsUseCase(project),
        getProject: new projectUC.GetProjectUseCase(project),
        createProject: new projectUC.CreateProjectUseCase(project),
        editProject: new projectUC.EditProjectUseCase(project),
        deleteProject: new projectUC.DeleteProjectUseCase(project),
        getProjectStatuses: new projectUC.GetProjectStatusesUseCase(project),
        getCandidates: new projectUC.GetProjectCandidatesUseCase(user),
        getProjectDetail: new projectUC.GetProjectDetailUseCase(project, projectMember, task),
      },
      projectMember: {
        getProjectMembers: new projectMemberUC.GetProjectMembersUseCase(projectMember),
        leaveProject: new projectMemberUC.LeaveProjectUseCase(projectMember),
        removeMember: new projectMemberUC.RemoveProjectMemberUseCase(projectMember, project),
        addMember: new projectMemberUC.AddProjectMembersUseCase(projectMember, project),
      },
      tasks: {
        getProjectTasks: new taskUC.GetProjectTasksUseCase(task),
        getCurrentUserTasks: new taskUC.GetCurrentUserTasksUseCase(task),
        getTaskDetail: new taskUC.GetTaskDetailUseCase(task, user, project),
        getTask: new taskUC.GetTaskUseCase(task),
        createTask: new taskUC.CreateTaskUseCase(task),
        selectProject: new taskUC.SelectProjectForTaskUseCase(projectMember),
        editTask: new taskUC.EditTaskUseCase(task),
        deleteTask: new taskUC.DeleteTaskUseCase(task),
        changeAssignee: new taskUC.ChangeAssigneeUseCase(task, user),
        changeStatus: new taskUC.ChangeStatusUseCase(task, project),
      },
      auth: {
        login: new authUC.LoginUseCase(auth),
        signUp: new authUC.SignUpUseCase(auth),
        checkAuthStatus: new authUC.CheckAuthStatusUseCase(auth, user),
        changePassword: new authUC.ChangePasswordUseCase(auth),
        recoveryPassword: new authUC.RecoveryPasswordUseCase(auth),
        resetPassword: new authUC.ResetPasswordUseCase(auth),
        resendEmailVerification: new authUC.ResendEmailVerificationUseCase(auth),
        verifyEmail: new authUC.VerifyEmailUseCase(auth),
      },
      user: {
        getCurrentUser: new userUC.GetCurrentUserUseCase(user),
        uploadAvatar: new userUC.UploadAvatarUseCase(user),
        updateUser: new userUC.UpdateUserUseCase(user),
      },
    };
  }

  getUsecases(): UseCasesContainer {
    return this.usecases;
  }

  getRepositories(): RepositoriesContainer {
    return this.repositories;
  }

  // getConfig() {
  //   return this.config;
  // }

  // getHttp() {
  //   return this.http;
  // }

  /**
   * Factory method for creating container with default configuration
   */
  static create(config?: DIContainerConfig): DIContainer {
    return new DIContainer(config);
  }

  /**
   * Factory method for creating test container with mock overrides
   */
  static testing(overrides?: Partial<DIContainerConfig>): DIContainer {
    return new DIContainer(overrides);
  }
}

// ========================
// Export
// ========================

export const appContainer = DIContainer.create();
