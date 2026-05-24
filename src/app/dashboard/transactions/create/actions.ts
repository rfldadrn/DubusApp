"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

type ItemChargeInput = {
  label: string;
  amount: number;
  note?: string;
};

type TransactionItemInput = {
  itemId: number;
  fabricSource: "Customer" | "Store";
  fabricId?: number;
  fabricPrice?: number;
  fabricMeters?: number;
  sewingPrice: number;
  modelDescription?: string;
  statusItemId: number;
  headerSizeCustomerId?: number;
  charges: ItemChargeInput[];
};

type PaymentInput = {
  amount: number;
  paymentTypeId: number;
  walletId: number;
  note?: string;
};

type TransactionInput = {
  customerId: number;
  transactionDate: Date;
  completionDate?: Date;
  statusTransactionId: number;
  note?: string;
  items: TransactionItemInput[];
  payment?: PaymentInput;
};

function getInitialPaymentStatus(totalAmount: number, paidAmount: number) {
  if (paidAmount <= 0) return "Unpaid" as const;
  if (paidAmount >= totalAmount) return "Paid" as const;
  return "Partial" as const;
}

function isTransactionIdUniqueError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const target = (error.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.includes("id");
  if (typeof target === "string") return target.includes("id");
  return false;
}

async function syncTransactionIdSequence() {
  // Keep sequence aligned with actual max(id) to prevent duplicate key on auto-increment.
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"transactions"', 'id'),
      COALESCE((SELECT MAX(id) FROM "transactions"), 0) + 1,
      false
    )
  `);
}

export async function createTransaction(data: TransactionInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Generate transaction code
    const today = new Date();
    const dateCode = today.toISOString().split("T")[0].replace(/-/g, "");
    const count = await prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(today.setHours(0, 0, 0, 0)),
          lt: new Date(today.setHours(23, 59, 59, 999)),
        },
      },
    });
    const transactionCode = `TRX${dateCode}${String(count + 1).padStart(4, "0")}`;

    // Calculate total amount
    let totalAmount = 0;
    for (const item of data.items) {
      totalAmount += item.sewingPrice;
      // Add fabric cost if store fabric
      if (item.fabricSource === "Store" && item.fabricPrice && item.fabricMeters) {
        totalAmount += item.fabricPrice * item.fabricMeters;
      }
      // Add charges
      const chargesTotal = item.charges.reduce((sum, charge) => sum + charge.amount, 0);
      totalAmount += chargesTotal;
    }

    // Create transaction with items
    const paidAmount = data.payment?.amount || 0;
    const initialPaymentStatus = getInitialPaymentStatus(totalAmount, paidAmount);

    const createPayload = {
      transactionCode,
      customerId: data.customerId,
      transactionDate: data.transactionDate,
      completionDate: data.completionDate,
      totalAmount,
      paymentStatus: initialPaymentStatus,
      statusTransactionId: data.statusTransactionId,
      note: data.note,
      createdBy: Number(session.user.id),
      items: {
        create: data.items.map((item) => ({
          itemId: item.itemId,
          fabricSource: item.fabricSource,
          fabricId: item.fabricSource === "Store" ? item.fabricId : null,
          fabricPrice: item.fabricPrice || null,
          fabricMeters: item.fabricMeters || null,
          modelDescription: item.modelDescription,
          sewingPrice: item.sewingPrice,
          statusItemId: item.statusItemId,
          headerSizeCustomerId: item.headerSizeCustomerId,
          charges: {
            create: item.charges.map((charge) => ({
              label: charge.label,
              amount: charge.amount,
              note: charge.note || null,
            })),
          },
        })),
      },
    };

    let transaction;
    try {
      transaction = await prisma.transaction.create({ data: createPayload });
    } catch (error) {
      if (!isTransactionIdUniqueError(error)) {
        throw error;
      }

      // Self-heal when DB sequence drifts after manual imports/seeds.
      await syncTransactionIdSequence();
      transaction = await prisma.transaction.create({ data: createPayload });
    }

    // Create payment record if payment info provided
    if (data.payment) {
      const payment = await prisma.payment.create({
        data: {
          transactionId: transaction.id,
          amount: data.payment.amount,
          balanceAfter: totalAmount - data.payment.amount,
          paymentTypeId: data.payment.paymentTypeId,
          walletId: data.payment.walletId,
          receivedBy: Number(session.user.id),
          note: data.payment.note || "Uang muka / DP",
        },
      });

      await prisma.cashLedger.create({
        data: {
          type: "Debit",
          category: "Pembayaran Pelanggan",
          description: `Pembayaran ${transaction.transactionCode}`,
          amount: data.payment.amount,
          walletId: data.payment.walletId,
          paymentId: payment.id,
          createdBy: Number(session.user.id),
        },
      });
    }

    // Fetch complete transaction data for invoice
    const completeTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: {
        customer: true,
        items: {
          include: {
            item: true,
            fabric: true,
            charges: true,
          },
        },
      },
    });

    revalidatePath("/dashboard/transactions");
    return { 
      success: true, 
      data: {
        id: transaction.id,
        transactionCode: transaction.transactionCode,
        customerName: completeTransaction?.customer.name || "",
        customerPhone: completeTransaction?.customer.phoneNumber || undefined,
        transactionDate: transaction.transactionDate.toLocaleDateString("id-ID"),
        completionDate: transaction.completionDate?.toLocaleDateString("id-ID"),
        items: completeTransaction?.items.map((item) => ({
          itemName: item.item.name,
          sewingPrice: Number(item.sewingPrice),
          fabricPrice: item.fabricPrice ? Number(item.fabricPrice) : undefined,
          fabricMeters: item.fabricMeters ? Number(item.fabricMeters) : undefined,
          fabricCost: item.fabricPrice && item.fabricMeters 
            ? Number(item.fabricPrice) * Number(item.fabricMeters) 
            : undefined,
          modelDescription: item.modelDescription || undefined,
          fabricSource: item.fabricSource,
          fabricName: item.fabric?.name,
          charges: item.charges.map((charge) => ({
            label: charge.label,
            amount: Number(charge.amount),
            note: charge.note || undefined,
          })),
        })) || [],
        totalAmount: Number(totalAmount),
        downPayment: data.payment?.amount,
        remainingAmount: Number(totalAmount) - (data.payment?.amount || 0),
        note: transaction.note || undefined,
      }
    };
  } catch (error) {
    console.error("Create transaction error:", error);
    return { success: false, error: "Failed to create transaction" };
  }
}
