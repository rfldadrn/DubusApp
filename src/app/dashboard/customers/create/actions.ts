"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

type CustomerInput = {
  name: string;
  phoneNumber?: string;
  gender?: "Laki_laki" | "Perempuan";
};

export async function createCustomer(data: CustomerInput) {
  try {
    const customer = await prisma.customer.create({
      data: {
        name: data.name.trim(),
        phoneNumber: normalizePhoneNumber(data.phoneNumber),
        gender: data.gender || null,
      },
    });

    revalidatePath("/dashboard/customers");
    revalidateTag("transaction-create-form-data");
    return { success: true, data: customer };
  } catch (error) {
    console.error("Create customer error:", error);
    return { success: false, error: "Failed to create customer" };
  }
}
