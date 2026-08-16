import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyApiToken } from "@/lib/api-token";
import { timingSafeEqual } from "crypto";
import { NextRequest } from "next/server";

type ApiAccess =
  | { ok: true; userId: number | null; source: "bearer" | "session" }
  | { ok: false; error: string; status: number };

function safeTokenEquals(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  if (receivedBuffer.length !== expectedBuffer.length) return false;
  return timingSafeEqual(receivedBuffer, expectedBuffer);
}

function getBearerToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

export async function requireApiAccess(req: NextRequest, options: { allowSession?: boolean } = {}): Promise<ApiAccess> {
  const configuredToken = (process.env.DUBUS_API_BEARER_TOKEN || process.env.EXTERNAL_API_TOKEN || "").trim();
  const bearerToken = getBearerToken(req);

  if (bearerToken) {
    if (configuredToken && safeTokenEquals(bearerToken, configuredToken)) {
      return { ok: true, userId: null, source: "bearer" };
    }

    const payload = verifyApiToken(bearerToken);
    if (payload) {
      const user = await prisma.user.findFirst({
        where: { id: Number(payload.sub), rowStatus: true },
        select: { id: true },
      });
      if (user) return { ok: true, userId: user.id, source: "bearer" };
    }

    return { ok: false, error: "Unauthorized", status: 401 };
  }

  if (options.allowSession !== false) {
    const session = await auth();
    if (session?.user?.id) {
      return { ok: true, userId: Number(session.user.id), source: "session" };
    }
  }

  return { ok: false, error: "Unauthorized", status: 401 };
}