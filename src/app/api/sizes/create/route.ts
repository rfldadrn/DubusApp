import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

type SizeValueInput = {
  itemSizeId: number;
  size: number;
};

type RequestBody = {
  customerId: number;
  itemId: number;
  note?: string;
  sizeValues: SizeValueInput[];
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body: RequestBody = await request.json();
    const { customerId, itemId, note, sizeValues } = body;

    if (!customerId || !itemId || !sizeValues || sizeValues.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create header size customer with size details
    const headerSize = await prisma.headerSizeCustomer.create({
      data: {
        customerId,
        itemId,
        note,
        createdBy: Number(session.user.id),
        itemSizeCustomers: {
          create: sizeValues.map((sv) => ({
            itemSizeId: sv.itemSizeId,
            size: sv.size,
          })),
        },
      },
      include: {
        itemSizeCustomers: {
          include: {
            itemSize: true,
          },
        },
        item: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: headerSize.id,
        label: `${headerSize.item.name} - ${headerSize.itemSizeCustomers
          .map((isc) => `${isc.itemSize.name}: ${Number(isc.size)}cm`)
          .join(", ")}`,
      },
    });
  } catch (error) {
    console.error("Create size error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create size" },
      { status: 500 }
    );
  }
}
