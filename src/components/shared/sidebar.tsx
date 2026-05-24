"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Factory,
  Wallet,
  Database,
  FileText,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  BookOpen,
  HandCoins,
  Building2,
  LucideIcon,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export interface MenuItem {
  id: number;
  label: string;
  href: string;
  icon: string;
  parentId: number;
  children?: MenuItem[];
}

interface SidebarProps {
  menus: MenuItem[];
}

// Map icon names to Lucide icon components
const iconMap: Record<string, LucideIcon> = {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Factory,
  Wallet,
  Database,
  FileText,
  Settings,
  BookOpen,
  HandCoins,
  Building2,
};

function buildMenuTree(menus: MenuItem[]): MenuItem[] {
  const map = new Map<number, MenuItem>();
  const roots: MenuItem[] = [];

  menus.forEach((m) => {
    map.set(m.id, { ...m, children: [] });
  });

  menus.forEach((m) => {
    const item = map.get(m.id)!;
    if (m.parentId && m.parentId > 0 && map.has(m.parentId)) {
      map.get(m.parentId)!.children!.push(item);
    } else {
      roots.push(item);
    }
  });

  return roots;
}

function isMenuActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === href || pathname.startsWith(href + "/");
}

function isMenuOrChildActive(pathname: string, item: MenuItem): boolean {
  if (isMenuActive(pathname, item.href)) return true;
  if (item.children) {
    return item.children.some((child) => isMenuOrChildActive(pathname, child));
  }
  return false;
}

function MenuItemComponent({ item, pathname, depth = 0 }: { item: MenuItem; pathname: string; depth?: number }) {
  const hasChildren = item.children && item.children.length > 0;
  const isActive = isMenuActive(pathname, item.href);
  const isChildActive = hasChildren && isMenuOrChildActive(pathname, item);
  const [expanded, setExpanded] = useState(isChildActive);
  const Icon = iconMap[item.icon] || LayoutDashboard;

  if (hasChildren) {
    return (
      <div>
        <button
          suppressHydrationWarning
          onClick={() => setExpanded(!expanded)}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors w-full text-left",
            isChildActive
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            depth > 0 && "pl-8"
          )}
        >
          <Icon className="h-5 w-5" />
          <span className="font-medium flex-1">{item.label}</span>
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {expanded && (
          <div className="ml-2 mt-1 space-y-1">
            {item.children!.map((child) => (
              <MenuItemComponent key={`menu-${child.id}`} item={child} pathname={pathname} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        depth > 0 && "pl-8"
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="font-medium">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ menus }: SidebarProps) {
  const pathname = usePathname();
  const menuTree = buildMenuTree(menus);

  return (
    <div className="flex flex-col h-full bg-card border-r">
      <div className="p-6 border-b">
        <h2 className="text-2xl font-bold text-primary">Toko Jahit</h2>
        <p className="text-sm text-muted-foreground">Management System</p>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuTree.map((item) => (
          <MenuItemComponent key={`menu-${item.id}`} item={item} pathname={pathname} />
        ))}
      </nav>

      <div className="p-4 border-t">
        <Button
          suppressHydrationWarning
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
