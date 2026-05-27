"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";

type CustomerInput = {
  name: string;
  phoneNumber?: string;
  gender?: "Laki_laki" | "Perempuan";
  agencyId?: number | null;
};

export async function updateCustomer(id: number, data: CustomerInput) {
  try {
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name.trim(),
        phoneNumber: normalizePhoneNumber(data.phoneNumber),
        gender: data.gender || null,
        agencyId: data.agencyId === undefined ? undefined : data.agencyId,
      },
    });

    revalidatePath("/dashboard/customers");
    revalidatePath(`/dashboard/customers/${id}`);
    revalidatePath("/dashboard/agency");
    revalidateTag("transaction-create-form-data");
    return { success: true, data: customer };
  } catch (error) {
    console.error("Update customer error:", error);
    return { success: false, error: "Failed to update customer" };
  }
}
