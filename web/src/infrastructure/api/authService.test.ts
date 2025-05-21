import MockAdapter from "axios-mock-adapter";

import axiosClient from "./axiosClient";
import { authService } from "./authService";
import { API_ROUTES } from "../config/apiRoutes";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";

type AuthPayload = {
  email: string;
  password: string;
};

let authPayload: AuthPayload;

describe("AuthService login", () => {
  let mockAxiosClient: MockAdapter;
  authPayload = { email: "example@rambler.ru", password: "password" };

  beforeEach(() => {
    mockAxiosClient = new MockAdapter(axiosClient);
  });

  afterEach(() => {
    mockAxiosClient.reset();
  });

  it("should call the login endpoint and return the response 200 OK", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.LOGIN).reply(200, null);
    // Act
    const login = authService.login(authPayload);
    // Assert
    expect(await login).toBeUndefined();
    expect(mockAxiosClient.history.post.length).toBe(1);
  });

  it("should call the login endpoint without wrong email or password and return 401 error", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.LOGIN).reply(401, null);
    // Act
    const login = authService.login(authPayload);
    // Assert
    await expect(login).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.invalidCredentials)
    );
  });
  it("should call the login endpoint without wrong request body and return 400 error", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.LOGIN).reply(400, null);
    // Act
    const login = authService.login(authPayload);
    // Assert
    await expect(login).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.invalidRequestBody)
    );
  });
  it("should call the login endpoint and return 500 error", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.LOGIN).reply(500, null);
    // Act
    const login = authService.login(authPayload);
    // Assert
    await expect(login).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong)
    );
  });
  it("should call the login endpoint with network error and return 500 error", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.LOGIN).networkError();
    // Act
    const login = authService.login(authPayload);
    // Assert
    await expect(login).rejects.toThrow(
      new AppError(AppErrorType.NETWORK, errorTexts.networkProblem)
    );
  });
});

describe("AuthService signUp", () => {
  let mockAxiosClient: MockAdapter;

  beforeEach(() => {
    mockAxiosClient = new MockAdapter(axiosClient);
  });

  afterEach(() => {
    mockAxiosClient.reset();
  });

  it("should call the signup endpoint and return the response 200 OK", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.SIGNUP).reply(200, null);
    // Act
    const signUp = authService.signUp(authPayload);
    // Assert
    expect(await signUp).toBeUndefined();
    expect(mockAxiosClient.history.post.length).toBe(1);
  });

  it("should call the signup endpoint with wrong request body and return 400 error", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.SIGNUP).reply(400, null);
    // Act
    const signUp = authService.signUp(authPayload);
    // Assert
    await expect(signUp).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.invalidCredentials)
    );
  });

  it("should call the signup endpoint and return 500 error", async () => {
    // Arrange
    mockAxiosClient.onPost(API_ROUTES.SIGNUP).reply(500, null);
    // Act
    const signUp = authService.signUp({
      email: "example@rambler.ru",
      password: "password",
    });
    // Assert
    await expect(signUp).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong)
    );
  });
});
