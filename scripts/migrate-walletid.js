require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🔧 Running migration: Make walletId optional in payments table...');
  
  try {
    // Check current constraint
    const checkResult = await prisma.$queryRaw`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'payments'
        AND column_name = 'walletId';
    `;
    
    console.log('Current walletId column:', checkResult);
    
    // Alter table to make walletId nullable
    await prisma.$executeRaw`
      ALTER TABLE payments 
      ALTER COLUMN "walletId" DROP NOT NULL;
    `;
    
    console.log('✅ Migration successful: walletId is now optional');
    
    // Verify the change
    const verifyResult = await prisma.$queryRaw`
      SELECT 
        column_name,
        is_nullable,
        data_type
      FROM information_schema.columns
      WHERE table_name = 'payments'
        AND column_name = 'walletId';
    `;
    
    console.log('After migration:', verifyResult);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
