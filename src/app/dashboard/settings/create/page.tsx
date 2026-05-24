import { prisma } from "@/lib/prisma";
import { UserForm } from "../users/create/user-form";

async function getRoles() {
  const roles = await prisma.role.findMany({
    where: { rowStatus: true },
    orderBy: { roleName: "asc" },
  });
  return roles;
}

export default async function SettingsCreatePage() {
  const roles = await getRoles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tambah User</h1>
        <p className="text-muted-foreground">Tambahkan pengguna baru ke sistem</p>
      </div>
      <UserForm roles={roles} />
    </div>
  );
}
