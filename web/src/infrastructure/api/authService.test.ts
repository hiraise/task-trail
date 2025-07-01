import MockAdapter from "axios-mock-adapter";

import axiosClient from "./axiosClient";
import { authService } from "./authService";
import { API_ROUTES } from "../config/apiRoutes";
import { AppError, AppErrorType } from "@/shared/errors/types";
import { errorTexts } from "@/shared/locales/messages";
import { authPayload } from "@/shared/constants/testConstants";

describe("AuthService login", () => {
  let mockAxiosClient: MockAdapter;

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

describe("AuthService logout", () => {
  let mockAxiosClient: MockAdapter;

  beforeEach(() => {
    mockAxiosClient = new MockAdapter(axiosClient);
  });

  afterEach(() => {
    mockAxiosClient.reset();
  });

  it("should call the logout endpoint and return the response 200 OK", async () => {
    mockAxiosClient.onPost(API_ROUTES.LOGOUT).reply(200, null);
    const logout = authService.logout();
    expect(await logout).toBeUndefined();
    expect(mockAxiosClient.history.post.length).toBe(1);
    expect(mockAxiosClient.history.post[0].url).toBe(API_ROUTES.LOGOUT);
    expect(mockAxiosClient.history.post[0].method).toBe("post");
  });

  it("should call the logout endpoint and return 401 error", async () => {
    mockAxiosClient.onPost(API_ROUTES.LOGOUT).reply(401, null);
    const logout = authService.logout();
    expect(mockAxiosClient.history.post.length).toBe(1);
    expect(mockAxiosClient.history.post[0].url).toBe(API_ROUTES.LOGOUT);
    expect(mockAxiosClient.history.post[0].method).toBe("post");
    await expect(logout).rejects.toThrow(AppError);
    await expect(logout).rejects.toThrow(errorTexts.authenticationRequired);
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

describe("AuthService resendVerification", () => {
  let mockAxiosClient: MockAdapter;
  let email: string;

  beforeEach(() => {
    mockAxiosClient = new MockAdapter(axiosClient);
    email = "example@microsoft.com";
  });

  afterEach(() => {
    mockAxiosClient.reset();
  });

  it("should call the resend verification endpoint and return the response 200 OK", async () => {
    mockAxiosClient.onPost(API_ROUTES.RESEND_VERIFICATION).reply(200, null);
    const resendVerification = authService.resendVerification(email);
    expect(await resendVerification).toBeUndefined();
    expect(mockAxiosClient.history.post.length).toBe(1);
  });

  it("should call the resend verification endpoint with wrong email and return 400 error", async () => {
    mockAxiosClient.onPost(API_ROUTES.RESEND_VERIFICATION).reply(400, null);
    const resendVerification = authService.resendVerification(email);
    await expect(resendVerification).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong)
    );
  });
});

describe("AuthService verifyEmail", () => {
  let mockAxiosClient: MockAdapter;
  let token: string;

  beforeEach(() => {
    mockAxiosClient = new MockAdapter(axiosClient);
    token = "valid-token";
  });
  afterEach(() => {
    mockAxiosClient.reset();
  });

  it("should call the verify email endpoint and return the response 200 OK", async () => {
    mockAxiosClient.onPost(API_ROUTES.VERIFY).reply(200, null);
    const verifyEmail = authService.confirmEmail(token);
    expect(await verifyEmail).toBeUndefined();
    expect(mockAxiosClient.history.post.length).toBe(1);
  });

  it("should call the verify email endpoint with wrong token and return 400 error", async () => {
    mockAxiosClient.onPost(API_ROUTES.VERIFY).reply(400, null);
    const verifyEmail = authService.confirmEmail(token);
    await expect(verifyEmail).rejects.toThrow(
      new AppError(AppErrorType.AUTH, errorTexts.somethingWentWrong)
    );
  });
});
