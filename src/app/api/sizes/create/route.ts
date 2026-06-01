import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  customerId: z.number().int().positive(),
  itemId: z.number().int().positive(),
  note: z.string().trim().max(2000).optional(),
  sizeValues: z
    .array(
      z.object({
        itemSizeId: z.number().int().positive(),
        size: z.number().nonnegative().max(999),
      })
    )
    .min(1, "Minimal 1 ukuran")
    .max(100),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = bodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" },
        { status: 400 }
      );
    }
    const { customerId, itemId, note, sizeValues } = parsed.data;

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
