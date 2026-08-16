import { createHmac, timingSafeEqual } from "crypto";

type ApiTokenPayload = {
  sub: string;
  username: string;
  roleId: number;
  role: string;
  type: "api";
  iat: number;
  exp: number;
};

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlJson(value: unknown) {
  return base64UrlEncode(JSON.stringify(value));
}

function getApiTokenSecret() {
  return (process.env.DUBUS_API_JWT_SECRET || process.env.AUTH_SECRET || "").trim();
}

function sign(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function createApiToken(input: { userId: number; username: string; roleId: number; role: string }, expiresInSeconds = 60 * 60) {
  const secret = getApiTokenSecret();
  if (!secret) throw new Error("API token secret is not configured");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "HS256", typ: "JWT" };
  const payload: ApiTokenPayload = {
    sub: String(input.userId),
    username: input.username,
    roleId: input.roleId,
    role: input.role,
    type: "api",
    iat: now,
    exp: now + expiresInSeconds,
  };

  const unsigned = `${base64UrlJson(header)}.${base64UrlJson(payload)}`;
  return `${unsigned}.${sign(unsigned, secret)}`;
}

export function verifyApiToken(token: string): ApiTokenPayload | null {
  const secret = getApiTokenSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = sign(`${header}.${payload}`, secret);
  const receivedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (receivedBuffer.length !== expectedBuffer.length || !timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ApiTokenPayload;
    if (decoded.type !== "api") return null;
    if (!decoded.sub || !decoded.exp) return null;
    if (decoded.exp <= Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}