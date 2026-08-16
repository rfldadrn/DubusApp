import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function getInternalToken(): string {
  return (
    process.env.RBAC_INTERNAL_TOKEN ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  );
}

export async function GET(req: NextRequest) {
  try {
    const expectedToken = getInternalToken();
    const receivedToken = req.headers.get("x-rbac-internal-token") || "";

    if (!expectedToken || receivedToken !== expectedToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleIdParam = req.nextUrl.searchParams.get("roleId");
    const roleId = Number(roleIdParam);

    if (!roleIdParam || Number.isNaN(roleId) || roleId <= 0) {
      return NextResponse.json({ error: "Invalid roleId" }, { status: 400 });
    }

    const mappings = await prisma.roleMenuMapping.findMany({
      where: { roleId },
      include: {
        menu: {
          select: {
            menuUrl: true,
            rowStatus: true,
            isMenu: true,
          },
        },
      },
    });

    const allowedPaths = mappings
      .filter((rm) => rm.menu.rowStatus && rm.menu.isMenu && !!rm.menu.menuUrl)
      .map((rm) => rm.menu.menuUrl as string);

    return NextResponse.json({ allowedPaths });
  } catch (error) {
    console.error("RBAC allowed paths error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
