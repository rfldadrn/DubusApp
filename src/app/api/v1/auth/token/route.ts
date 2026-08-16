import { createApiToken } from "@/lib/api-token";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tokenRequestSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const parsed = tokenRequestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Username dan password wajib diisi" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: parsed.data.username, rowStatus: true },
      include: { role: true },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(parsed.data.password, user.password);
    if (!validPassword) {
      return NextResponse.json({ success: false, error: "Invalid credentials" }, { status: 401 });
    }

    const expiresIn = 60 * 60;
    const accessToken = createApiToken(
      {
        userId: user.id,
        username: user.username,
        roleId: user.roleId,
        role: user.role.roleName,
      },
      expiresIn
    );

    return NextResponse.json({
      success: true,
      data: {
        accessToken,
        tokenType: "Bearer",
        expiresIn,
        user: {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          role: user.role.roleName,
          roleId: user.roleId,
        },
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create token";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}