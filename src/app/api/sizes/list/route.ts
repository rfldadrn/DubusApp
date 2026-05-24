import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const customerId = searchParams.get("customerId");
    const itemId = searchParams.get("itemId");

    if (!customerId || !itemId) {
      return NextResponse.json(
        { success: false, error: "Missing customerId or itemId" },
        { status: 400 }
      );
    }

    const sizeHeaders = await prisma.headerSizeCustomer.findMany({
      where: {
        customerId: Number(customerId),
        itemId: Number(itemId),
        rowStatus: true,
      },
      include: {
        itemSizeCustomers: {
          where: { rowStatus: true },
          include: {
            itemSize: true,
          },
          orderBy: {
            itemSize: {
              sortOrder: "asc",
            },
          },
        },
        item: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const options = sizeHeaders.map((header) => {
      const sizeDetails = header.itemSizeCustomers
        .map((isc) => `${isc.itemSize.name}: ${Number(isc.size)}cm`)
        .join(", ");
      
      const dateStr = header.createdAt.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      
      return {
        value: header.id.toString(),
        label: header.note || `Ukuran ${dateStr}`,
        description: sizeDetails,
      };
    });

    return NextResponse.json({ success: true, data: options });
  } catch (error) {
    console.error("List sizes error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sizes" },
      { status: 500 }
    );
  }
}
