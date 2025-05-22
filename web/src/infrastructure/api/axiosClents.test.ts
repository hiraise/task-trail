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

  it("should not refresh if _skipAuthRefresh is set", async () => {
    // Arrange
    const endpoint = "/test-endpoint";
    mockAxiosClient.onGet(endpoint).replyOnce(401);

    // Act & Assert
    await expect(
      axiosClient.get(endpoint, { _skipAuthRefresh: true })
    ).rejects.toThrow();
    expect(mockAxiosClient.history.post.length).toBe(0);
  });

  it("should not refresh if request is to LOGIN route", async () => {
    // Arrange
    mockAxiosClient.onGet(API_ROUTES.LOGIN).replyOnce(401);

    // Act & Assert
    await expect(axiosClient.get(API_ROUTES.LOGIN)).rejects.toThrow();
    expect(mockAxiosClient.history.post.length).toBe(0);
  });

  it("queues and resolves requests after token refresh", async () => {
    // Arrange
    const endpoint = "/test-endpoint";
    mockAxiosClient.onPost(API_ROUTES.REFRESH).reply(200);
    mockAxiosClient.onGet(endpoint).replyOnce(401); // first request in queue
    mockAxiosClient.onGet(endpoint).replyOnce(401); // second request in queue
    mockAxiosClient.onGet(endpoint).reply(200, { ok: true }); // retry request

    // Act
    const req1 = axiosClient.get(endpoint);
    const req2 = axiosClient.get(endpoint);
    const [res1, res2] = await Promise.all([req1, req2]);

    // Assert
    expect(res1.status).toBe(200);
    expect(res2.status).toBe(200);
    expect(mockAxiosClient.history.post.length).toBe(1);
    expect(mockAxiosClient.history.get.length).toBe(4); //2 initial 401 + 2 retries
  });

 it("should reject all queued requests if refresh fails", async () => {
  // Arrange
  const endpoint = "/test-endpoint";
  mockAxiosClient.onPost(API_ROUTES.REFRESH).reply(500); 
  mockAxiosClient.onGet(endpoint).replyOnce(401);
  mockAxiosClient.onGet(endpoint).replyOnce(401);

  // Act
  const req1 = axiosClient.get(endpoint).catch((e) => e);
  const req2 = axiosClient.get(endpoint).catch((e) => e);
  const [err1, err2] = await Promise.all([req1, req2]);

  // Assert
  expect(err1).toBeInstanceOf(Error);
  expect(err2).toBeInstanceOf(Error);
  expect(mockAxiosClient.history.post.length).toBe(1); // only one refresh attempt
  expect(mockAxiosClient.history.get.length).toBe(2); // 2 initial 401 requests
});

});
