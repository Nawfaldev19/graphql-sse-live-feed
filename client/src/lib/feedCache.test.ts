import { appendPage, prependLive } from "./feedCache";

const item = (id: string) => ({ id });

describe("feed cache helpers", () => {
  it("appends an older page without duplicates", () => {
    expect(appendPage([item("5"), item("4")], [item("4"), item("3")]).map((entry) => entry.id)).toEqual([
      "5",
      "4",
      "3",
    ]);
  });

  it("prepends a live item once, even if it arrives twice", () => {
    const once = prependLive([item("4")], item("5"));
    const twice = prependLive(once, item("5"));
    expect(twice.map((entry) => entry.id)).toEqual(["5", "4"]);
    expect(twice).not.toBe(once);
  });
});
