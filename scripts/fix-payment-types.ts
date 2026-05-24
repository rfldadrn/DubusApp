import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Fixing payment_types table...");
  
  // Add code column if it doesn't exist
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'payment_types' AND column_name = 'code'
      ) THEN
        ALTER TABLE payment_types ADD COLUMN code VARCHAR(15) UNIQUE NOT NULL DEFAULT 'TEMP';
      END IF;
    END $$;
  `);
  
  console.log("✅ code column added/verified for payment_types");
  
  console.log("🎉 Payment types table fixed!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
