import { NextRequest } from "next/server";
import { middleware } from "./middleware";
import { protectedRoutes, ROUTES } from "./infrastructure/config/routes";

// mocking NextResponse from next/server
jest.mock("next/server", () => {
  const originalModule = jest.requireActual("next/server");
  return {
    ...originalModule,
    NextResponse: {
      next: jest.fn(() => ({ type: "next", status: 200 })),
      redirect: jest.fn((url) => ({ type: "redirect", url: url.toString() })),
    },
  };
});

function getMockRequest(pathname: string, cookie: string = ""): NextRequest {
  const url = new URL(process.env.NEXT_PUBLIC_API_URL + pathname);
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  return new NextRequest(url, { headers });
}

function getMockResponse(statusCode: number): Response {
  return new Response(null, { status: statusCode });
}

describe("middleware", () => {
  let cookie: string;
  let apiUrl: string;

  beforeEach(() => {
    jest.resetModules();
    cookie = "access_token=valid";
    apiUrl = "http://test-backend";
    process.env.NEXT_PUBLIC_API_URL = apiUrl;
    (global.fetch as unknown) = undefined; // reset fetch
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should allow public routes to pass through", async () => {
    // Arrange
    const req = getMockRequest("/");

    // Act
    const res = await middleware(req);

    // Assert
    
    expect(res.type).toBe("next");
  });

  it("should allow an authorized user to access a protected route", async () => {
    // Arrange
    const protectedPath = protectedRoutes[0] + "/any";
    const req = getMockRequest(protectedPath, cookie);
    global.fetch = jest.fn(() => Promise.resolve(getMockResponse(200)));

    // Act
    const res = await middleware(req);

    // Assert
    expect(res.type).toBe("next");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining(apiUrl),
      expect.objectContaining({
        headers: expect.objectContaining({ cookie: cookie }),
      })
    );
  });

  it("should not call fetch if there is no cookie", async () => {
    // Arrange
    const protectedPath = protectedRoutes[0] + "/any";
    const req = getMockRequest(protectedPath, ""); // no cookie
    global.fetch = jest.fn();

    // Act
    const res = await middleware(req);

    // Assert
    expect(res.type).toBe("redirect");
    expect(global.fetch).not.toHaveBeenCalled();
    expect(res.url).toContain(ROUTES.login);
  });

  it("should redirect to the login screen if the user is not authorized", async () => {
    // Arrange
    const protectedPath = protectedRoutes[0] + "/any";
    const req = getMockRequest(protectedPath, cookie);
    global.fetch = jest.fn(() => Promise.resolve(getMockResponse(401)));

    // Act
    const res = await middleware(req);

    // Assert
    expect(res.type).toBe("redirect");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(fetchCall.headers["cookie"]).toBe(cookie);
    expect(res.url).toContain(ROUTES.login);
    expect(res.url).toContain(`from=${encodeURIComponent(protectedPath)}`);
  });

  it("should redirect to the login screen if the API call fails", async () => {
    // Arrange
    const protectedPath = protectedRoutes[0] + "/settings";
    const req = getMockRequest(protectedPath, cookie);
    global.fetch = jest.fn(() => Promise.reject(new Error("API error")));

    // Act
    const res = await middleware(req);

    // Assert
    expect(res.type).toBe("redirect");
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchCall = (global.fetch as jest.Mock).mock.calls[0][1];
    expect(fetchCall.headers["cookie"]).toBe(cookie);
    expect(res.url).toContain(ROUTES.login);
  });
});
