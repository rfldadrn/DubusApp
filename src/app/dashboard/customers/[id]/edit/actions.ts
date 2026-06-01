"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath, revalidateTag } from "next/cache";
import { normalizePhoneNumber } from "@/lib/phone";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().trim().min(1, "Nama wajib diisi").max(100),
  phoneNumber: z.string().trim().max(30).optional(),
  gender: z.enum(["Laki_laki", "Perempuan"]).optional(),
  agencyId: z.number().int().positive().nullable().optional(),
});

type CustomerInput = z.infer<typeof customerSchema>;

export async function updateCustomer(id: number, data: CustomerInput) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const parsed = customerSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Input tidak valid" };
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: parsed.data.name,
        phoneNumber: normalizePhoneNumber(parsed.data.phoneNumber),
        gender: parsed.data.gender || null,
        agencyId: parsed.data.agencyId === undefined ? undefined : parsed.data.agencyId,
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
