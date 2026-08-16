import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Sidebar } from "@/components/shared/sidebar";
import { SessionActivityTracker } from "@/components/shared/session-activity-tracker";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

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

function normalizePath(path: string): string {
  if (!path) return "/";
  if (path.length > 1 && path.endsWith("/")) {
    return path.slice(0, -1);
  }
  return path;
}

function hasMenuAccess(pathname: string, allowedHrefs: string[]): boolean {
  const currentPath = normalizePath(pathname);

  // Always allow dashboard home for authenticated users.
  if (currentPath === "/dashboard") {
    return true;
  }

  return allowedHrefs.some((href) => {
    const allowedPath = normalizePath(href);
    if (currentPath === allowedPath) {
      return true;
    }

    // Prevent /dashboard permission from granting all nested routes.
    if (allowedPath === "/dashboard") {
      return false;
    }

    return currentPath.startsWith(`${allowedPath}/`);
  });
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
  const headerStore = await headers();
  const currentPathname = headerStore.get("x-pathname") || "/dashboard";

  // Fetch allowed menus for this role
  const roleMenus = await getRoleMenus(userRoleId);

  const allowedHrefs = roleMenus
    .filter((rm) => rm.menu.rowStatus && rm.menu.isMenu && !!rm.menu.menuUrl)
    .map((rm) => rm.menu.menuUrl as string);

  if (!hasMenuAccess(currentPathname, allowedHrefs)) {
    redirect("/dashboard");
  }

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
      <SessionActivityTracker />
      <aside className="w-64 hidden md:block">
        <Sidebar menus={menus} />
      </aside>
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="container mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
