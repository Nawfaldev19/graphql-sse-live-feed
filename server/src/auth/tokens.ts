import { createHmac, timingSafeEqual } from "node:crypto";

export const TOKEN_LIFETIME_MS = 12 * 60 * 60 * 1000;

export interface Claims {
  sub: string;
  exp: number;
}

const encode = (value: string) => Buffer.from(value).toString("base64url");
const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url");

/** `<base64url(claims)>.<base64url(hmac-sha256)>` */
export function issueToken(personId: string, secret: string, now = Date.now()): string {
  const payload = encode(JSON.stringify({ sub: personId, exp: now + TOKEN_LIFETIME_MS } satisfies Claims));
  return `${payload}.${sign(payload, secret)}`;
}

/** Returns the verified claims, or null for a malformed, forged, or expired token. */
export function readToken(token: string, secret: string, now = Date.now()): Claims | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra !== undefined) return null;

  const expected = Buffer.from(sign(payload, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;

  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<Claims>;
    if (typeof claims.sub !== "string" || typeof claims.exp !== "number" || claims.exp <= now) return null;
    return { sub: claims.sub, exp: claims.exp };
  } catch {
    return null;
  }
}

/** Returns the person id, or null for a malformed, forged, or expired token. */
export function verifyToken(token: string, secret: string, now = Date.now()): string | null {
  return readToken(token, secret, now)?.sub ?? null;
}
