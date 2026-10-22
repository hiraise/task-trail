import { initials } from "./initials";

describe("initials", () => {
  it("первые буквы двух слов имени или ящика почты", () => {
    expect(initials("Daria F")).toBe("DF");
    expect(initials("ivanov_sergey")).toBe("IS");
    expect(initials("petrova.anna@example.com")).toBe("PA");
  });

  it("одно слово — две первые буквы", () => {
    expect(initials("Olga")).toBe("OL");
    expect(initials("admin@tasktrail.local")).toBe("AD");
  });
});
