import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

// Force dynamic rendering to prevent database access during build
export const dynamic = 'force-dynamic';

function getRoleMenus(roleId: number) {
  return unstable_cache(
    async () => {
      return prisma.roleMenuMapping.findMany({
        where: { roleId },
        include: {
          menu: true,
        },
        orderBy: {
          menu: { orderNo: "asc" },
        },
      });
    },
    [`role-menus-${roleId}`],
    {
      revalidate: 300,
      tags: [`role-menus-${roleId}`],
    }
  )();
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const userRoleId = (session.user as any).roleId as number;

  // Fetch allowed menus for this role
  const roleMenus = await getRoleMenus(userRoleId);

  // Filter active menus - include both leaf menus and parent menus that have children
  const allMenus = roleMenus
    .filter((rm) => rm.menu.rowStatus)
    .map((rm) => ({
      id: rm.menu.id,
      label: rm.menu.menuName,
      href: rm.menu.menuUrl || "",
      icon: rm.menu.menuIcon || "",
      parentId: rm.menu.parentId,
      isMenu: rm.menu.isMenu,
    }));

  // Get parent IDs that have children in the list
  const parentIds = new Set(allMenus.filter((m) => m.parentId > 0).map((m) => m.parentId));

  // Include menus that: (a) are leaf menus with URL, or (b) are parent menus with children
  const menus = allMenus.filter((m) => (m.isMenu && m.href) || parentIds.has(m.id));

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-64 hidden md:block">
        <Sidebar menus={menus} />
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
