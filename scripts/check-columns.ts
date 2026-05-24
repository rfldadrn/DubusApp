import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Checking table columns...");
  
  // Check transaction_items columns
  const transactionItemsColumns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'transaction_items'
    ORDER BY ordinal_position;
  `;
  
  console.log("\ntransaction_items columns:", transactionItemsColumns);
  
  // Check transactions columns
  const transactionsColumns = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'transactions'
    ORDER BY ordinal_position;
  `;
  
  console.log("\ntransactions columns:", transactionsColumns);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
