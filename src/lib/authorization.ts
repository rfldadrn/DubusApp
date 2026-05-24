import { auth } from "@/lib/auth";

const ADMIN_ROLES = new Set(["SuperAdmin", "Admin"]);

export async function requireAuthSession() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, error: "Unauthorized" };
  }
  return { ok: true as const, session };
}

export async function requireAdminSession() {
  const result = await requireAuthSession();
  if (!result.ok) {
    return result;
  }

  const role = (result.session.user as { role?: string }).role;
  if (!role || !ADMIN_ROLES.has(role)) {
    return { ok: false as const, error: "Forbidden" };
  }

  return result;
}
