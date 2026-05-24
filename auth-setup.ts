// ============================================================
// FILE: src/lib/prisma.ts
// Prisma Client singleton (penting di Next.js dev mode)
// ============================================================

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


// ============================================================
// FILE: src/lib/auth.ts
// NextAuth v5 config dengan Prisma Adapter + credentials
// ============================================================

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: {
            username: credentials.username as string,
            rowStatus: true,
          },
          include: {
            role: true,
          },
        });

        if (!user) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        );

        if (!isValid) return null;

        return {
          id: String(user.id),
          name: user.fullName,
          username: user.username,
          role: user.role.roleName,
          roleId: user.roleId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.username = (user as any).username;
        token.role = (user as any).role;
        token.roleId = (user as any).roleId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).username = token.username;
        (session.user as any).role = token.role;
        (session.user as any).roleId = token.roleId;
      }
      return session;
    },
  },
});


// ============================================================
// FILE: src/middleware.ts
// Proteksi route + role-based access
// ============================================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Definisi akses per role
const ROLE_ACCESS: Record<string, string[]> = {
  SuperAdmin: [
    "/dashboard",
    "/customers",
    "/transactions",
    "/master",
    "/reports",
    "/users",
    "/settings",
  ],
  Administrator: [
    "/dashboard",
    "/customers",
    "/transactions",
    "/reports",
  ],
};

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  // Kalau belum login, redirect ke login
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = (session.user as any).role as string;
  const allowedPaths = ROLE_ACCESS[role] ?? [];

  // Cek apakah path ini diizinkan untuk role ini
  const isAllowed = allowedPaths.some((path) => pathname.startsWith(path));

  if (!isAllowed) {
    // Redirect ke dashboard jika tidak punya akses
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};


// ============================================================
// FILE: src/app/api/auth/[...nextauth]/route.ts
// ============================================================

import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;


// ============================================================
// FILE: prisma/seed.ts
// Data awal: roles, super admin, menu, payment types
// ============================================================

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Roles
  const superAdminRole = await prisma.role.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, roleName: "SuperAdmin" },
  });

  const adminRole = await prisma.role.upsert({
    where: { id: 2 },
    update: {},
    create: { id: 2, roleName: "Administrator" },
  });

  console.log("✅ Roles seeded");

  // Super Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      fullName: "Super Admin",
      username: "superadmin",
      password: hashedPassword,
      roleId: superAdminRole.id,
    },
  });

  console.log("✅ Users seeded");
  console.log("   → username: superadmin");
  console.log("   → password: admin123  ← GANTI SEGERA!");

  // Menus
  const menus = [
    { id: 1, menuName: "Dashboard", menuUrl: "/dashboard", menuIcon: "ti-home", parentId: 0, isMenu: true, orderNo: 1 },
    { id: 2, menuName: "Master Data", menuUrl: null, menuIcon: "ti-database", parentId: 0, isMenu: false, orderNo: 2 },
    { id: 3, menuName: "Item & Ukuran", menuUrl: "/master/items", menuIcon: "ti-shirt", parentId: 2, isMenu: true, orderNo: 1 },
    { id: 4, menuName: "Kain / Bahan", menuUrl: "/master/fabrics", menuIcon: "ti-stack", parentId: 2, isMenu: true, orderNo: 2 },
    { id: 5, menuName: "Metode Bayar", menuUrl: "/master/payment-types", menuIcon: "ti-credit-card", parentId: 2, isMenu: true, orderNo: 3 },
    { id: 6, menuName: "Pelanggan", menuUrl: "/customers", menuIcon: "ti-users", parentId: 0, isMenu: true, orderNo: 3 },
    { id: 7, menuName: "Transaksi", menuUrl: "/transactions", menuIcon: "ti-receipt", parentId: 0, isMenu: true, orderNo: 4 },
    { id: 8, menuName: "Dinas / Borongan", menuUrl: "/agencies", menuIcon: "ti-building", parentId: 0, isMenu: true, orderNo: 5 },
    { id: 9, menuName: "Laporan", menuUrl: "/reports", menuIcon: "ti-chart-bar", parentId: 0, isMenu: true, orderNo: 6 },
    { id: 10, menuName: "Manajemen User", menuUrl: "/users", menuIcon: "ti-user-cog", parentId: 0, isMenu: true, orderNo: 7 },
  ];

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: {},
      create: menu,
    });
  }

  console.log("✅ Menus seeded");

  // Role-Menu mapping (SuperAdmin dapat semua)
  for (const menu of menus) {
    await prisma.roleMenuMapping.upsert({
      where: { id: menu.id },
      update: {},
      create: { roleId: superAdminRole.id, menuId: menu.id },
    });
  }

  // Administrator dapat menu terbatas
  const adminMenuIds = [1, 6, 7, 8, 9]; // dashboard, pelanggan, transaksi, dinas, laporan
  for (const menuId of adminMenuIds) {
    await prisma.roleMenuMapping.create({
      data: { roleId: adminRole.id, menuId },
    }).catch(() => {}); // skip kalau sudah ada
  }

  console.log("✅ Role-menu mappings seeded");

  // Payment Types
  const paymentTypes = [
    { name: "Tunai" },
    { name: "QRIS" },
    { name: "Transfer Bank (BNI)" },
    { name: "Transfer Bank (BCA)" },
    { name: "Transfer Bank (Nagari)" },
  ];

  for (const pt of paymentTypes) {
    await prisma.paymentType.upsert({
      where: { id: paymentTypes.indexOf(pt) + 1 },
      update: {},
      create: { id: paymentTypes.indexOf(pt) + 1, ...pt },
    });
  }

  console.log("✅ Payment types seeded");

  // Contoh Items (jenis pakaian)
  const items = [
    { id: 1, name: "Kemeja Lengan Panjang", description: "Kemeja pria lengan panjang", customerPrice: 175000, employeePrice: 50000 },
    { id: 2, name: "Batik Puring Lengan Panjang", description: "Batik pria dengan puring", customerPrice: 350000, employeePrice: 150000 },
    { id: 3, name: "Batik Kemeja Lengan Panjang", description: "Batik pria non puring", customerPrice: 200000, employeePrice: 100000 },
    { id: 4, name: "Celana Pria", description: "Celana pria", customerPrice: 200000, employeePrice: 75000 },
    { id: 5, name: "Rok", description: "Rok wanita", customerPrice: 150000, employeePrice: 50000 },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }

  console.log("✅ Items seeded");

  // Item sizes (field ukuran per item)
  const itemSizes = [
    // Celana Pria (itemId: 4)
    { itemId: 4, name: "Lebar Pinggang", isMandatory: false, sortOrder: 1 },
    { itemId: 4, name: "Lebar Panggul", isMandatory: false, sortOrder: 2 },
    { itemId: 4, name: "Panjang Pisak", isMandatory: false, sortOrder: 3 },
    { itemId: 4, name: "Lebar Paha", isMandatory: false, sortOrder: 4 },
    { itemId: 4, name: "Lebar Lutut", isMandatory: false, sortOrder: 5 },
    { itemId: 4, name: "Lebar Kaki", isMandatory: false, sortOrder: 6 },
    { itemId: 4, name: "Panjang", isMandatory: false, sortOrder: 7 },
    // Rok (itemId: 5)
    { itemId: 5, name: "Lebar Pinggang", isMandatory: true, sortOrder: 1 },
    { itemId: 5, name: "Lebar Panggul", isMandatory: true, sortOrder: 2 },
    { itemId: 5, name: "Panjang Rok", isMandatory: true, sortOrder: 3 },
    { itemId: 5, name: "Lebar Bawah", isMandatory: false, sortOrder: 4 },
  ];

  for (const size of itemSizes) {
    await prisma.itemSize.create({ data: size }).catch(() => {});
  }

  console.log("✅ Item sizes seeded");
  console.log("\n🎉 Seeding selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
