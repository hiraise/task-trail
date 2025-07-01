import { createLogoutThunk } from "./createLogoutThunk";

const TYPE_PREFIX = "auth/logout";

describe("logout thunk", () => {
  let mockLogout: jest.Mock;
  let thunk: ReturnType<ReturnType<typeof createLogoutThunk>>;
  let dispatch: jest.Mock;
  let getState: jest.Mock;
  let extra: unknown = {};

  beforeEach(() => {
    mockLogout = jest.fn();
    const logoutThunk = createLogoutThunk(mockLogout);
    thunk = logoutThunk();
    dispatch = jest.fn();
    getState = jest.fn();
    extra = {};
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call logout with correct dispatch", async () => {
    mockLogout.mockResolvedValueOnce(undefined);
    const result = await thunk(dispatch, getState, extra);
    expect(mockLogout).toHaveBeenCalled();
    expect(result.payload).toBeUndefined();
    expect(result.type).toBe(`${TYPE_PREFIX}/fulfilled`);
  });

  it("error in logout calls handleThunkError and reject", async () => {
    const error = new Error("Network error");
    mockLogout.mockRejectedValueOnce(error);
    const result = await thunk(dispatch, getState, extra);
    expect(mockLogout).toHaveBeenCalled();
    expect(result.type).toBe("auth/logout/rejected");
  });
});
