"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RolePermissionsDialog } from "./roles/role-permissions-dialog";

type Role = {
  id: number;
  roleName: string;
  _count: {
    users: number;
    roleMenuMappings: number;
  };
};

type RolesSectionProps = {
  roles: Role[];
};

export function RolesSection({ roles }: RolesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & Permissions</CardTitle>
        <CardDescription>Role dan jumlah akses menu</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <h3 className="font-semibold">{role.roleName}</h3>
                <p className="text-sm text-muted-foreground">
                  {role._count.users} users • {role._count.roleMenuMappings} menu
                  access
                </p>
              </div>
              <RolePermissionsDialog roleId={role.id} roleName={role.roleName} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
