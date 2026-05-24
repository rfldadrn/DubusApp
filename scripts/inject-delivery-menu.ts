import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const deliveryMenu = await prisma.menu.upsert({
    where: { id: 12 },
    update: {
      menuName: "Pengantaran",
      menuUrl: "/dashboard/delivery",
      menuIcon: "Truck",
      menuSlug: "delivery",
      isMenu: true,
      orderNo: 10,
      parentId: 0,
    },
    create: {
      id: 12,
      menuName: "Pengantaran",
      menuUrl: "/dashboard/delivery",
      menuIcon: "Truck",
      menuSlug: "delivery",
      isMenu: true,
      orderNo: 10,
      parentId: 0,
    },
  });

  const rolesAndMenus: Array<{ roleId: number; menuId: number }> = [
    { roleId: 1, menuId: deliveryMenu.id },
    { roleId: 2, menuId: deliveryMenu.id },
    { roleId: 4, menuId: deliveryMenu.id },
  ];

  for (const mapping of rolesAndMenus) {
    const existing = await prisma.roleMenuMapping.findFirst({
      where: { roleId: mapping.roleId, menuId: mapping.menuId },
      select: { id: true },
    });

    if (existing) continue;

    const maxId = await prisma.roleMenuMapping.aggregate({
      _max: { id: true },
    });

    await prisma.roleMenuMapping.create({
      data: {
        id: (maxId._max.id || 0) + 1,
        roleId: mapping.roleId,
        menuId: mapping.menuId,
      },
    });
  }

  console.log("Delivery menu injected successfully");
}

main()
  .catch((error) => {
    console.error("Failed to inject delivery menu:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
