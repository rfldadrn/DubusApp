import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Creating status tables...");
  
  // Create status_items table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS status_items (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      "colorSlug" VARCHAR(100),
      "iconSlug" VARCHAR(100),
      sequence INTEGER NOT NULL DEFAULT 0,
      "rowStatus" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log("✅ status_items table created");
  
  // Create status_transactions table
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS status_transactions (
      id SERIAL PRIMARY KEY,
      code VARCHAR(10) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      "colorSlug" VARCHAR(100),
      "iconSlug" VARCHAR(100),
      sequence INTEGER NOT NULL DEFAULT 0,
      "rowStatus" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  console.log("✅ status_transactions table created");
  
  // Add statusItemId column to transaction_items if it doesn't exist
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transaction_items' AND column_name = 'statusItemId'
      ) THEN
        ALTER TABLE transaction_items ADD COLUMN "statusItemId" INTEGER NOT NULL DEFAULT 1;
      END IF;
    END $$;
  `);
  
  console.log("✅ statusItemId column added to transaction_items");
  
  // Add statusTransactionId column to transactions if it doesn't exist
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'transactions' AND column_name = 'statusTransactionId'
      ) THEN
        ALTER TABLE transactions ADD COLUMN "statusTransactionId" INTEGER NOT NULL DEFAULT 1;
      END IF;
    END $$;
  `);
  
  console.log("✅ statusTransactionId column added to transactions");
  
  // Add foreign keys to transaction_items
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transaction_items_statusItemId_fkey'
      ) THEN
        ALTER TABLE transaction_items 
        ADD CONSTRAINT "transaction_items_statusItemId_fkey" 
        FOREIGN KEY ("statusItemId") REFERENCES status_items(id) ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  
  console.log("✅ transaction_items foreign key added");
  
  // Add foreign keys to transactions
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'transactions_statusTransactionId_fkey'
      ) THEN
        ALTER TABLE transactions 
        ADD CONSTRAINT "transactions_statusTransactionId_fkey" 
        FOREIGN KEY ("statusTransactionId") REFERENCES status_transactions(id) ON DELETE RESTRICT ON UPDATE CASCADE;
      END IF;
    END $$;
  `);
  
  console.log("✅ transactions foreign key added");
  
  console.log("🎉 All status tables created successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
