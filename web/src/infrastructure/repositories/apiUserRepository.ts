import type { UserRepository } from "@/domain/repositories/UserRepository";

import type { CurrentUser, UpdateCurrentUserRequest, User } from "../api/generated";
import { API_ROUTES } from "../config/apiRoutes";
import axiosClient from "../http/axiosClient";
import type { HttpClient } from "../http/HttpClient";

import { toCurrentUser, toUser } from "./mappers";

// Multipart field with the avatar file — uploadAvatar in the contract
const AVATAR_FIELD = "file";

const createUserRepository = (http: HttpClient): UserRepository => ({
  getCurrentUser: async () => toCurrentUser(await http.get<CurrentUser>(API_ROUTES.CURRENT_USER)),

  updateCurrentUser: async (username) => {
    const body: UpdateCurrentUserRequest = { username };

    return toCurrentUser(await http.patch<CurrentUser>(API_ROUTES.CURRENT_USER, body));
  },

  uploadAvatar: async (file) => {
    const form = new FormData();

    form.append(AVATAR_FIELD, file, file.name);

    const dto = await http.patch<CurrentUser>(API_ROUTES.UPLOAD_AVATAR, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return toCurrentUser(dto);
  },

  findById: async (id) => toUser(await http.get<User>(API_ROUTES.USER_BY_ID(id))),

  findCandidatesForProject: async (projectId) => {
    const dtos = await http.get<User[]>(API_ROUTES.GET_CANDIDATES, {
      params: projectId ? { projectId } : undefined,
    });

    return dtos.map(toUser);
  },
});

export const userRepository: UserRepository = createUserRepository(axiosClient);
