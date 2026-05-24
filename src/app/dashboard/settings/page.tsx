import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Users, Shield, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RolesSection } from "./roles-section";

async function getSettingsData() {
  const [users, roles, menus] = await Promise.all([
    prisma.user.findMany({
      where: { rowStatus: true },
      include: {
        role: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.role.findMany({
      where: { rowStatus: true },
      include: {
        _count: {
          select: { users: true, roleMenuMappings: true },
        },
      },
    }),
    prisma.menu.findMany({
      where: { rowStatus: true },
      orderBy: { orderNo: "asc" },
    }),
  ]);

  return { users, roles, menus };
}

export default async function SettingsPage() {
  const data = await getSettingsData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola pengguna, role, dan konfigurasi sistem
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pengguna aktif</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.roles.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Role terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Menus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.menus.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Menu sistem</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>{data.users.length} pengguna terdaftar</CardDescription>
            </div>
            <a href="/dashboard/settings/create">
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Tambah User
              </Button>
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Lengkap</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.fullName}</TableCell>
                    <TableCell className="font-mono text-sm">{user.username}</TableCell>
                    <TableCell>
                      <Badge variant={user.role.roleName === "SuperAdmin" ? "default" : "secondary"}>
                        {user.role.roleName}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(user.createdAt), "dd MMM yyyy", { locale: id })}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <RolesSection roles={data.roles} />
    </div>
  );
}
