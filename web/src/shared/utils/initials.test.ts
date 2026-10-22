import { initials } from "./initials";

describe("initials", () => {
  it("first letters of two words of the name or mailbox", () => {
    expect(initials("Daria F")).toBe("DF");
    expect(initials("ivanov_sergey")).toBe("IS");
    expect(initials("petrova.anna@example.com")).toBe("PA");
  });

  it("one word — its first two letters", () => {
    expect(initials("Olga")).toBe("OL");
    expect(initials("admin@tasktrail.local")).toBe("AD");
  });
});
