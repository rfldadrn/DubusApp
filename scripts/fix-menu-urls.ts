import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Updating menu URLs...");

  const updates = [
    { id: 2, menuUrl: "/dashboard/transactions" },
    { id: 3, menuUrl: "/dashboard/customers" },
    { id: 4, menuUrl: "/dashboard/production" },
    { id: 5, menuUrl: "/dashboard/finance" },
    { id: 6, menuUrl: "/dashboard/master" },
    { id: 7, menuUrl: "/dashboard/reports" },
    { id: 8, menuUrl: "/dashboard/settings" },
  ];

  for (const update of updates) {
    await prisma.menu.update({
      where: { id: update.id },
      data: { menuUrl: update.menuUrl },
    });
  }

  console.log("✅ Menu URLs updated!");
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
