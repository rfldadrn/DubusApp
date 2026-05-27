"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
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

function isIdUniqueError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const target = (error.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.includes("id");
  if (typeof target === "string") return target.includes("id");
  return false;
}

function isTransactionCodeUniqueError(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code !== "P2002") return false;

  const target = (error.meta as { target?: unknown } | undefined)?.target;
  if (Array.isArray(target)) return target.includes("transactionCode");
  if (typeof target === "string") return target.includes("transactionCode");
  return false;
}

async function generateNextTransactionCode() {
  const now = new Date();
  const dateCode = now.toISOString().split("T")[0].replace(/-/g, "");
  const sequenceKey = `transaction-code-${dateCode}`;

  return prisma.$transaction(async (tx) => {
    let sequence = await tx.sequence.findUnique({
      where: { key: sequenceKey },
      select: { lastNumber: true },
    });

    if (!sequence) {
      const latestToday = await tx.transaction.findFirst({
        where: {
          transactionCode: {
            startsWith: `TRX${dateCode}`,
          },
        },
        select: { transactionCode: true },
        orderBy: { transactionCode: "desc" },
      });

      const latestNumber = latestToday?.transactionCode
        ? Number(latestToday.transactionCode.slice(-4)) || 0
        : 0;

      try {
        await tx.sequence.create({
          data: {
            key: sequenceKey,
            lastNumber: latestNumber,
          },
        });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }
      }
    }

    const updated = await tx.sequence.update({
      where: { key: sequenceKey },
      data: { lastNumber: { increment: 1 } },
      select: { lastNumber: true },
    });

    return `TRX${dateCode}${String(updated.lastNumber).padStart(4, "0")}`;
  });
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

async function syncTableIdSequence(tableName: "payments" | "cash_ledger") {
  await prisma.$executeRawUnsafe(`
    SELECT setval(
      pg_get_serial_sequence('"${tableName}"', 'id'),
      COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1,
      false
    )
  `);
}

async function createTransactionWithLockedId(createPayload: any) {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`LOCK TABLE "transactions" IN EXCLUSIVE MODE`);

    const rows = await tx.$queryRawUnsafe<Array<{ next_id: number }>>(
      `SELECT COALESCE(MAX(id), 0) + 1 AS next_id FROM "transactions"`
    );
    const nextId = Number(rows[0]?.next_id || 1);

    const created = await tx.transaction.create({
      data: {
        ...createPayload,
        id: nextId,
      },
    });

    await tx.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"transactions"', 'id'),
        ${nextId + 1},
        false
      )
    `);

    return created;
  });
}

export async function createTransaction(data: TransactionInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    let transactionCode = await generateNextTransactionCode();

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
    let attempts = 0;
    while (!transaction && attempts < 5) {
      attempts += 1;

      try {
        createPayload.transactionCode = transactionCode;
        transaction = await prisma.transaction.create({ data: createPayload });
      } catch (error) {
        if (isTransactionCodeUniqueError(error)) {
          transactionCode = await generateNextTransactionCode();
          continue;
        }

        if (isIdUniqueError(error)) {
          // Self-heal when DB sequence drifts after manual imports/seeds.
          await syncTransactionIdSequence();

          try {
            transaction = await prisma.transaction.create({ data: createPayload });
            break;
          } catch (retryError) {
            if (!isIdUniqueError(retryError)) {
              throw retryError;
            }

            // Last fallback for concurrent race: lock table and assign id deterministically.
            transaction = await createTransactionWithLockedId(createPayload);
            break;
          }
        }

        throw error;
      }
    }

    if (!transaction) {
      return { success: false, error: "Gagal membuat transaksi: kode transaksi bentrok berulang" };
    }

    // Create payment record if payment info provided
    if (data.payment) {
      let payment;

      try {
        payment = await prisma.payment.create({
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
      } catch (error) {
        if (!isIdUniqueError(error)) {
          throw error;
        }

        await syncTableIdSequence("payments");

        payment = await prisma.payment.create({
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
      }

      try {
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
      } catch (error) {
        if (!isIdUniqueError(error)) {
          throw error;
        }

        await syncTableIdSequence("cash_ledger");

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
    revalidatePath("/dashboard/production");
    revalidateTag("transactions-page-data");
    revalidateTag("production-page-data");
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
    console.error("Create transaction error detail:", {
      message: error instanceof Error ? error.message : String(error),
      prismaCode:
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.code
          : undefined,
      prismaMeta:
        error instanceof Prisma.PrismaClientKnownRequestError
          ? error.meta
          : undefined,
      stack: error instanceof Error ? error.stack : undefined,
    });

    const detail = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error:
        process.env.NODE_ENV === "development"
          ? `Failed to create transaction: ${detail}`
          : "Failed to create transaction",
    };
  }
}
