import { act, render, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { SessionProvider, useSession } from "./session";

const wrapper = ({ children }: { children: ReactNode }) => <SessionProvider>{children}</SessionProvider>;

describe("session", () => {
  it("persists token and space, and clears both on sign-out", () => {
    const { result } = renderHook(() => useSession(), { wrapper });
    act(() => {
      result.current.signIn("t1");
      result.current.selectSpace("riverside");
    });
    expect(window.localStorage.getItem("live-feed.token")).toBe("t1");
    expect(result.current.spaceId).toBe("riverside");

    act(() => {
      result.current.signOut();
    });
    expect(result.current.token).toBeNull();
    expect(result.current.spaceId).toBeNull();
    expect(window.localStorage.getItem("live-feed.space")).toBeNull();
  });

  it("throws outside the provider", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const Probe = () => <p>{useSession().token}</p>;
    expect(() => render(<Probe />)).toThrow("useSession must be used inside <SessionProvider>");
  });
});
