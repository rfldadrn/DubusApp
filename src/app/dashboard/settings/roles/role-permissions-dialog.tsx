"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updateRolePermissions, getRolePermissions, getMenus } from "./actions";
import { toast } from "sonner";

type Menu = {
  id: number;
  menuName: string;
  menuUrl: string | null;
  menuIcon: string | null;
  menuSlug: string | null;
  parentId: number;
  isMenu: boolean;
  orderNo: number;
};

type RolePermissionsDialogProps = {
  roleId: number;
  roleName: string;
};

export function RolePermissionsDialog({
  roleId,
  roleName,
}: RolePermissionsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMenuIds, setSelectedMenuIds] = useState<number[]>([]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [menusResult, permissionsResult] = await Promise.all([
        getMenus(),
        getRolePermissions(roleId),
      ]);

      if (menusResult.success && menusResult.data) {
        setMenus(menusResult.data);
      }

      if (permissionsResult.success && permissionsResult.data) {
        const menuIds = permissionsResult.data.map((p: any) => p.menuId);
        setSelectedMenuIds(menuIds);
      }
    } catch (error) {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMenu = (menuId: number) => {
    setSelectedMenuIds((prev) =>
      prev.includes(menuId)
        ? prev.filter((id) => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const result = await updateRolePermissions(roleId, selectedMenuIds);

      if (result.success) {
        toast.success("Permissions berhasil diupdate");
        setOpen(false);
      } else {
        toast.error(result.error || "Gagal mengupdate permissions");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Permissions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Permissions - {roleName}</DialogTitle>
          <DialogDescription>
            Pilih menu yang dapat diakses oleh role ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : (
            <div className="space-y-2">
              {menus.map((menu) => (
                <div
                  key={menu.id}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    id={`menu-${menu.id}`}
                    checked={selectedMenuIds.includes(menu.id)}
                    onChange={() => handleToggleMenu(menu.id)}
                    className="w-4 h-4"
                  />
                  <Label
                    htmlFor={`menu-${menu.id}`}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      {menu.parentId !== 0 && (
                        <span className="text-muted-foreground">└─</span>
                      )}
                      <span className="font-medium">{menu.menuName}</span>
                      {menu.menuUrl && (
                        <span className="text-sm text-muted-foreground">
                          ({menu.menuUrl})
                        </span>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
