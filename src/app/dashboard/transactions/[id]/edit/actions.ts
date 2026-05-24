"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

type ItemChargeInput = {
  id?: number;
  label: string;
  amount: number;
  note?: string;
};

type TransactionItemInput = {
  id?: number;
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

type TransactionUpdateInput = {
  id: number;
  customerId: number;
  transactionDate: Date;
  completionDate?: Date;
  statusTransactionId: number;
  note?: string;
  items: TransactionItemInput[];
};

export async function updateTransaction(data: TransactionUpdateInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

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

    // Get existing transaction to check payment status
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: data.id },
      include: {
        payments: true,
        items: {
          include: {
            charges: true,
          },
        },
      },
    });

    if (!existingTransaction) {
      return { success: false, error: "Transaction not found" };
    }

    // Calculate total paid
    const totalPaid = existingTransaction.payments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    // Determine payment status
    let paymentStatus: "Unpaid" | "Partial" | "Paid" = "Unpaid";
    if (totalPaid >= totalAmount) {
      paymentStatus = "Paid";
    } else if (totalPaid > 0) {
      paymentStatus = "Partial";
    }

    // Get existing item IDs and charge IDs
    const existingItemIds = existingTransaction.items.map(item => item.id);
    const newItemIds = data.items.filter(item => item.id).map(item => item.id!);
    const itemsToDelete = existingItemIds.filter(id => !newItemIds.includes(id));

    // Update transaction
    await prisma.transaction.update({
      where: { id: data.id },
      data: {
        customerId: data.customerId,
        transactionDate: data.transactionDate,
        completionDate: data.completionDate,
        totalAmount,
        paymentStatus,
        statusTransactionId: data.statusTransactionId,
        note: data.note,
      },
    });

    // Delete removed items (cascade will delete charges)
    if (itemsToDelete.length > 0) {
      await prisma.transactionItem.deleteMany({
        where: { id: { in: itemsToDelete } },
      });
    }

    // Update or create items
    for (const item of data.items) {
      if (item.id) {
        // Update existing item
        const existingItem = existingTransaction.items.find(ei => ei.id === item.id);
        
        if (existingItem) {
          // Get existing charge IDs
          const existingChargeIds = existingItem.charges.map(c => c.id);
          const newChargeIds = item.charges.filter(c => c.id).map(c => c.id!);
          const chargesToDelete = existingChargeIds.filter(id => !newChargeIds.includes(id));

          // Update item
          await prisma.transactionItem.update({
            where: { id: item.id },
            data: {
              itemId: item.itemId,
              fabricSource: item.fabricSource,
              fabricId: item.fabricSource === "Store" ? item.fabricId : null,
              fabricPrice: item.fabricPrice || null,
              fabricMeters: item.fabricMeters || null,
              modelDescription: item.modelDescription,
              sewingPrice: item.sewingPrice,
              statusItemId: item.statusItemId,
              headerSizeCustomerId: item.headerSizeCustomerId,
            },
          });

          // Delete removed charges
          if (chargesToDelete.length > 0) {
            await prisma.transactionItemCharge.deleteMany({
              where: { id: { in: chargesToDelete } },
            });
          }

          // Update or create charges
          for (const charge of item.charges) {
            if (charge.id) {
              // Update existing charge
              await prisma.transactionItemCharge.update({
                where: { id: charge.id },
                data: {
                  label: charge.label,
                  amount: charge.amount,
                  note: charge.note || null,
                },
              });
            } else {
              // Create new charge
              await prisma.transactionItemCharge.create({
                data: {
                  transactionItemId: item.id,
                  label: charge.label,
                  amount: charge.amount,
                  note: charge.note || null,
                },
              });
            }
          }
        }
      } else {
        // Create new item
        await prisma.transactionItem.create({
          data: {
            transactionId: data.id,
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
          },
        });
      }
    }

    revalidatePath("/dashboard/transactions");
    revalidatePath(`/dashboard/transactions/${data.id}`);
    revalidatePath(`/dashboard/transactions/${data.id}/edit`);
    
    return { success: true, data: { id: data.id } };
  } catch (error) {
    console.error("Update transaction error:", error);
    return { success: false, error: "Failed to update transaction" };
  }
}
