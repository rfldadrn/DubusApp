import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const bodySchema = z.object({
  headerSizeCustomerId: z.number().int().positive(),
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

    const { headerSizeCustomerId, note, sizeValues } = parsed.data;

    const existingHeader = await prisma.headerSizeCustomer.findFirst({
      where: {
        id: headerSizeCustomerId,
        rowStatus: true,
      },
      select: {
        id: true,
        itemId: true,
      },
    });

    if (!existingHeader) {
      return NextResponse.json(
        { success: false, error: "Data ukuran tidak ditemukan" },
        { status: 404 }
      );
    }

    const itemSizes = await prisma.itemSize.findMany({
      where: {
        itemId: existingHeader.itemId,
        rowStatus: true,
      },
      select: {
        id: true,
        isMandatory: true,
      },
    });

    const itemSizeIds = new Set(itemSizes.map((itemSize) => itemSize.id));
    const invalidSize = sizeValues.find((sizeValue) => !itemSizeIds.has(sizeValue.itemSizeId));

    if (invalidSize) {
      return NextResponse.json(
        { success: false, error: "Ada field ukuran yang tidak valid untuk item ini" },
        { status: 400 }
      );
    }

    const mandatoryIds = itemSizes.filter((itemSize) => itemSize.isMandatory).map((itemSize) => itemSize.id);
    const filledMandatoryCount = mandatoryIds.filter((mandatoryId) =>
      sizeValues.some((sizeValue) => sizeValue.itemSizeId === mandatoryId)
    ).length;

    if (filledMandatoryCount < mandatoryIds.length) {
      return NextResponse.json(
        { success: false, error: "Semua ukuran wajib harus diisi" },
        { status: 400 }
      );
    }

    const updatedHeader = await prisma.$transaction(async (tx) => {
      await tx.itemSizeCustomer.deleteMany({
        where: {
          headerSizeCustomerId,
        },
      });

      return tx.headerSizeCustomer.update({
        where: {
          id: headerSizeCustomerId,
        },
        data: {
          note,
          itemSizeCustomers: {
            create: sizeValues.map((sizeValue) => ({
              itemSizeId: sizeValue.itemSizeId,
              size: sizeValue.size,
            })),
          },
        },
        include: {
          itemSizeCustomers: {
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
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedHeader.id,
        label:
          updatedHeader.note ||
          `${updatedHeader.item.name} - ${updatedHeader.itemSizeCustomers
            .map((detail) => `${detail.itemSize.name}: ${Number(detail.size)}cm`)
            .join(", ")}`,
      },
    });
  } catch (error) {
    console.error("Update size error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update size" },
      { status: 500 }
    );
  }
}
