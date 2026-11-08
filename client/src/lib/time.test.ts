import { relativeTime } from "./time";

const NOW = Date.UTC(2031, 2, 10, 12, 0, 0);
const ago = (seconds: number) => new Date(NOW - seconds * 1000).toISOString();

describe("relativeTime", () => {
  it.each([
    [10, "just now"],
    [50, "1 minute ago"],
    [5 * 60, "5 minutes ago"],
    [2 * 3600, "2 hours ago"],
    [3 * 86_400, "3 days ago"],
  ])("%i seconds ago reads as %s", (seconds, expected) => {
    expect(relativeTime(ago(seconds), NOW, "en")).toBe(expected);
  });

  it("handles small clock skew into the future", () => {
    expect(relativeTime(new Date(NOW + 5000).toISOString(), NOW, "en")).toBe("just now");
  });
});
