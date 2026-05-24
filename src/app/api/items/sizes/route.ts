import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const itemId = searchParams.get("itemId");

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: "Missing itemId" },
        { status: 400 }
      );
    }

    const itemSizes = await prisma.itemSize.findMany({
      where: {
        itemId: Number(itemId),
        rowStatus: true,
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json({ success: true, data: itemSizes });
  } catch (error) {
    console.error("Fetch item sizes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch item sizes" },
      { status: 500 }
    );
  }
}
