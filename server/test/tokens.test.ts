import { createHmac } from "node:crypto";
import { issueToken, TOKEN_LIFETIME_MS, verifyToken } from "../src/auth/tokens.js";

const SECRET = "a".repeat(40);

describe("tokens", () => {
  it("round-trips the person id", () => {
    expect(verifyToken(issueToken("ada", SECRET), SECRET)).toBe("ada");
  });

  it("rejects expired tokens at the exact expiry", () => {
    const now = Date.UTC(2031, 0, 1);
    const token = issueToken("ada", SECRET, now);
    expect(verifyToken(token, SECRET, now + TOKEN_LIFETIME_MS - 1)).toBe("ada");
    expect(verifyToken(token, SECRET, now + TOKEN_LIFETIME_MS)).toBeNull();
  });

  it("rejects tokens signed with another secret or with an altered payload", () => {
    const token = issueToken("ada", SECRET);
    const [, signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "theo", exp: Date.now() + 1000 })).toString("base64url");

    expect(verifyToken(token, "b".repeat(40))).toBeNull();
    expect(verifyToken(`${forgedPayload}.${signature ?? ""}`, SECRET)).toBeNull();
  });

  it.each(["", "abc", "a.b.c", ".sig", "payload."])("rejects malformed token %j", (token) => {
    expect(verifyToken(token, SECRET)).toBeNull();
  });

  it("rejects a correctly signed payload that is not valid claims", () => {
    const sign = (payload: string) => `${payload}.${createHmac("sha256", SECRET).update(payload).digest("base64url")}`;

    expect(verifyToken(sign(Buffer.from("not json").toString("base64url")), SECRET)).toBeNull();
    expect(
      verifyToken(sign(Buffer.from(JSON.stringify({ sub: 1, exp: Date.now() + 1000 })).toString("base64url")), SECRET),
    ).toBeNull();
  });
});
