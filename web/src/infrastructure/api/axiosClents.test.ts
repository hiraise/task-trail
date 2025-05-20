import MockAdapter from "axios-mock-adapter";
import axiosClient from "./axiosClient";

import { API_ROUTES } from "../config/apiRoutes";

describe("axiosClient interceptors", () => {
  let mockAxiosClient: MockAdapter;

  beforeEach(() => {
    mockAxiosClient = new MockAdapter(axiosClient);
  });

  afterEach(() => {
    mockAxiosClient.reset();
  });

  it("should retry the request after refreshing the token on 401 error", async () => {
    // 401 → refresh → retry

    // Arrange
    const endpoint = "/test-endpoint";
    mockAxiosClient.onPost(API_ROUTES.REFRESH).reply(200);
    mockAxiosClient.onGet(endpoint).replyOnce(401);
    mockAxiosClient.onGet(endpoint).reply(200, { success: true });

    // Act
    const response = await axiosClient.get(endpoint);

    // Assert
    expect(response.status).toBe(200);
    expect(response.data).toEqual({ success: true });
    expect(mockAxiosClient.history.post.length).toBe(1);
    expect(mockAxiosClient.history.post[0].url).toBe(API_ROUTES.REFRESH);
    expect(mockAxiosClient.history.get.length).toBe(2); // One 401 request and one retry
  });

  it("should reject the request if refresh token fails", async () => {
    // 401 → refresh fails

    // Arrange
    const endpoint = "/test-endpoint";
    mockAxiosClient.onPost(API_ROUTES.REFRESH).reply(401);
    mockAxiosClient.onGet(endpoint).replyOnce(401);

    // Act & Assert
    await expect(axiosClient.get(endpoint)).rejects.toThrow();
    expect(mockAxiosClient.history.post.length).toBe(1);
    expect(mockAxiosClient.history.post[0].url).toBe(API_ROUTES.REFRESH);
    expect(mockAxiosClient.history.get.length).toBe(1); // Only one 401 request
  });
});