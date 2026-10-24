import { afterEach, describe, expect, it, vi } from "vitest";

import { saveBlob } from "./saveBlob";

// jsdom has no object URLs: the test puts its own and returns the originals afterwards
const { createObjectURL, revokeObjectURL } = URL;

describe("saveBlob", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  it("clicks a temporary download link with the name and revokes the URL", () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const create = vi.fn(() => "blob:local/1");
    const revoke = vi.fn();

    Object.assign(URL, { createObjectURL: create, revokeObjectURL: revoke });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(function (this: HTMLAnchorElement) {
        expect(this.download).toBe("отчёт.pdf");
        expect(this.href).toBe("blob:local/1");
        expect(document.body.contains(this)).toBe(true);
      });

    saveBlob(blob, "отчёт.pdf");

    expect(create).toHaveBeenCalledWith(blob);
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:local/1");
    expect(document.querySelector("a[download]")).toBeNull();
  });
});
