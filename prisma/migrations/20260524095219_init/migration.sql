-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Laki-laki', 'Perempuan');

-- CreateEnum
CREATE TYPE "GenderTarget" AS ENUM ('Pria', 'Wanita', 'Unisex');

-- CreateEnum
CREATE TYPE "FabricSource" AS ENUM ('Customer', 'Store');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('Regular', 'Agency');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Unpaid', 'Partial', 'Paid');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('Cash', 'QRIS', 'BankAccount', 'Other');

-- CreateEnum
CREATE TYPE "IroningType" AS ENUM ('Internal', 'External');

-- CreateEnum
CREATE TYPE "FoldType" AS ENUM ('Folded', 'Hanged');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('Pending', 'PartialDelivered', 'FullyDelivered');

-- CreateEnum
CREATE TYPE "AgencyStatus" AS ENUM ('Negotiation', 'Active', 'Completed', 'Cancelled');

-- CreateEnum
CREATE TYPE "WorkerRole" AS ENUM ('Tailor', 'Cutter');

-- CreateEnum
CREATE TYPE "CashEntryType" AS ENUM ('Debit', 'Credit');

-- CreateTable
CREATE TABLE "status_items" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "colorSlug" VARCHAR(100),
    "iconSlug" VARCHAR(100),
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "status_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_transactions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "colorSlug" VARCHAR(100),
    "iconSlug" VARCHAR(100),
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sequences" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "lastNumber" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "roleName" VARCHAR(100) NOT NULL,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menus" (
    "id" SERIAL NOT NULL,
    "menuName" VARCHAR(100) NOT NULL,
    "menuUrl" VARCHAR(255),
    "menuIcon" VARCHAR(50),
    "menuSlug" VARCHAR(100),
    "parentId" INTEGER NOT NULL DEFAULT 0,
    "isMenu" BOOLEAN NOT NULL DEFAULT false,
    "orderNo" INTEGER NOT NULL DEFAULT 0,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_menu_mappings" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "menuId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_menu_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "roleId" INTEGER NOT NULL,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employee_types" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "employees" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "address" VARCHAR(255),
    "phoneNumber" VARCHAR(20),
    "email" VARCHAR(100),
    "gender" "Gender",
    "joinDate" TIMESTAMP(3),
    "employeeTypeId" INTEGER,
    "avatar" VARCHAR(255),
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_types" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(15) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "defaultWalletId" INTEGER,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "genderTarget" "GenderTarget" NOT NULL DEFAULT 'Unisex',
    "customerPrice" DECIMAL(10,2) NOT NULL,
    "employeePrice" DECIMAL(10,2) NOT NULL,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_sizes" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "isMandatory" BOOLEAN NOT NULL DEFAULT false,
    "isStandard" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "item_sizes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fabrics" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "fabricType" VARCHAR(100) NOT NULL,
    "pricePerMeter" DECIMAL(10,2) NOT NULL,
    "stockMeters" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fabrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "walletType" "WalletType" NOT NULL,
    "bankName" VARCHAR(100),
    "accountNumber" VARCHAR(50),
    "openingBalance" DECIMAL(18,2) NOT NULL DEFAULT 0,
    "openingDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "phoneNumber" VARCHAR(20),
    "gender" "Gender",
    "agencyId" INTEGER,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "header_size_customers" (
    "id" SERIAL NOT NULL,
    "customerId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "note" TEXT,
    "createdBy" INTEGER NOT NULL,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "header_size_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "item_size_customers" (
    "id" SERIAL NOT NULL,
    "itemSizeId" INTEGER NOT NULL,
    "headerSizeCustomerId" INTEGER NOT NULL,
    "size" DECIMAL(10,2) NOT NULL,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "item_size_customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agencies" (
    "id" SERIAL NOT NULL,
    "agencyCode" VARCHAR(10) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "agencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agency_projects" (
    "id" SERIAL NOT NULL,
    "projectCode" VARCHAR(25) NOT NULL,
    "agencyId" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "picName" VARCHAR(100),
    "picPhone" VARCHAR(20),
    "startDate" TIMESTAMP(3),
    "targetDate" TIMESTAMP(3),
    "contractStatus" "AgencyStatus" NOT NULL DEFAULT 'Active',
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agency_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" SERIAL NOT NULL,
    "transactionCode" VARCHAR(50) NOT NULL,
    "customerId" INTEGER NOT NULL,
    "agencyProjectId" INTEGER,
    "type" "TransactionType" NOT NULL DEFAULT 'Regular',
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "completionDate" TIMESTAMP(3),
    "totalAmount" DECIMAL(18,2) NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'Unpaid',
    "statusTransactionId" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "createdBy" INTEGER NOT NULL,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_items" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "itemId" INTEGER NOT NULL,
    "headerSizeCustomerId" INTEGER,
    "fabricSource" "FabricSource" NOT NULL DEFAULT 'Store',
    "fabricId" INTEGER,
    "fabricName" VARCHAR(150),
    "fabricPrice" DECIMAL(10,2),
    "fabricMeters" DECIMAL(10,2),
    "modelDescription" TEXT,
    "modelImageUrl" VARCHAR(500),
    "sewingPrice" DECIMAL(10,2) NOT NULL,
    "targetDate" TIMESTAMP(3),
    "statusItemId" INTEGER NOT NULL,
    "assignedTailorId" INTEGER,
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction_item_charges" (
    "id" SERIAL NOT NULL,
    "transactionItemId" INTEGER NOT NULL,
    "label" VARCHAR(150) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "note" VARCHAR(255),
    "rowStatus" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "transaction_item_charges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" SERIAL NOT NULL,
    "transactionId" INTEGER NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "balanceAfter" DECIMAL(18,2) NOT NULL,
    "paymentTypeId" INTEGER NOT NULL,
    "walletId" INTEGER NOT NULL,
    "note" VARCHAR(500),
    "receivedBy" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "production_logs" (
    "id" SERIAL NOT NULL,
    "transactionItemId" INTEGER NOT NULL,
    "fromStatusId" INTEGER NOT NULL,
    "toStatusId" INTEGER NOT NULL,
    "notes" VARCHAR(255),
    "updatedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ironing_logs" (
    "id" SERIAL NOT NULL,
    "transactionItemId" INTEGER NOT NULL,
    "ironingType" "IroningType" NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "handledBy" INTEGER NOT NULL,
    "notes" VARCHAR(255),

    CONSTRAINT "ironing_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deliveries" (
    "id" SERIAL NOT NULL,
    "deliveryCode" VARCHAR(50) NOT NULL,
    "agencyProjectId" INTEGER NOT NULL,
    "deliveryDate" TIMESTAMP(3) NOT NULL,
    "destination" VARCHAR(255) NOT NULL,
    "recipientName" VARCHAR(100),
    "recipientPhone" VARCHAR(20),
    "status" "DeliveryStatus" NOT NULL DEFAULT 'Pending',
    "notes" TEXT,
    "handledBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_items" (
    "id" SERIAL NOT NULL,
    "deliveryId" INTEGER NOT NULL,
    "transactionItemId" INTEGER NOT NULL,
    "foldType" "FoldType" NOT NULL DEFAULT 'Folded',
    "recipientNote" VARCHAR(150),

    CONSTRAINT "delivery_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_logs" (
    "id" SERIAL NOT NULL,
    "transactionItemId" INTEGER NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "role" "WorkerRole" NOT NULL,
    "upah" DECIMAL(10,2) NOT NULL,
    "isPaid" BOOLEAN NOT NULL DEFAULT false,
    "payrollId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payrolls" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalItems" INTEGER NOT NULL,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidBy" INTEGER NOT NULL,
    "notes" VARCHAR(255),

    CONSTRAINT "payrolls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cash_ledger" (
    "id" SERIAL NOT NULL,
    "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" "CashEntryType" NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "walletId" INTEGER NOT NULL,
    "paymentId" INTEGER,
    "payrollId" INTEGER,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "cash_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "tableName" VARCHAR(100) NOT NULL,
    "recordId" INTEGER NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(45),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "status_items_code_key" ON "status_items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "status_transactions_code_key" ON "status_transactions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "sequences_key_key" ON "sequences"("key");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "payment_types_code_key" ON "payment_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "agencies_agencyCode_key" ON "agencies"("agencyCode");

-- CreateIndex
CREATE UNIQUE INDEX "agency_projects_projectCode_key" ON "agency_projects"("projectCode");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_transactionCode_key" ON "transactions"("transactionCode");

-- CreateIndex
CREATE UNIQUE INDEX "ironing_logs_transactionItemId_key" ON "ironing_logs"("transactionItemId");

-- CreateIndex
CREATE UNIQUE INDEX "deliveries_deliveryCode_key" ON "deliveries"("deliveryCode");

-- CreateIndex
CREATE UNIQUE INDEX "cash_ledger_paymentId_key" ON "cash_ledger"("paymentId");

-- CreateIndex
CREATE UNIQUE INDEX "cash_ledger_payrollId_key" ON "cash_ledger"("payrollId");

-- AddForeignKey
ALTER TABLE "role_menu_mappings" ADD CONSTRAINT "role_menu_mappings_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_menu_mappings" ADD CONSTRAINT "role_menu_mappings_menuId_fkey" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employees" ADD CONSTRAINT "employees_employeeTypeId_fkey" FOREIGN KEY ("employeeTypeId") REFERENCES "employee_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_types" ADD CONSTRAINT "payment_types_defaultWalletId_fkey" FOREIGN KEY ("defaultWalletId") REFERENCES "wallets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_sizes" ADD CONSTRAINT "item_sizes_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "header_size_customers" ADD CONSTRAINT "header_size_customers_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "header_size_customers" ADD CONSTRAINT "header_size_customers_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "header_size_customers" ADD CONSTRAINT "header_size_customers_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_size_customers" ADD CONSTRAINT "item_size_customers_itemSizeId_fkey" FOREIGN KEY ("itemSizeId") REFERENCES "item_sizes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "item_size_customers" ADD CONSTRAINT "item_size_customers_headerSizeCustomerId_fkey" FOREIGN KEY ("headerSizeCustomerId") REFERENCES "header_size_customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agencies" ADD CONSTRAINT "agencies_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agency_projects" ADD CONSTRAINT "agency_projects_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_agencyProjectId_fkey" FOREIGN KEY ("agencyProjectId") REFERENCES "agency_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_statusTransactionId_fkey" FOREIGN KEY ("statusTransactionId") REFERENCES "status_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_headerSizeCustomerId_fkey" FOREIGN KEY ("headerSizeCustomerId") REFERENCES "header_size_customers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_fabricId_fkey" FOREIGN KEY ("fabricId") REFERENCES "fabrics"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_statusItemId_fkey" FOREIGN KEY ("statusItemId") REFERENCES "status_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_items" ADD CONSTRAINT "transaction_items_assignedTailorId_fkey" FOREIGN KEY ("assignedTailorId") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction_item_charges" ADD CONSTRAINT "transaction_item_charges_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_paymentTypeId_fkey" FOREIGN KEY ("paymentTypeId") REFERENCES "payment_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receivedBy_fkey" FOREIGN KEY ("receivedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "production_logs" ADD CONSTRAINT "production_logs_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ironing_logs" ADD CONSTRAINT "ironing_logs_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ironing_logs" ADD CONSTRAINT "ironing_logs_handledBy_fkey" FOREIGN KEY ("handledBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_agencyProjectId_fkey" FOREIGN KEY ("agencyProjectId") REFERENCES "agency_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deliveries" ADD CONSTRAINT "deliveries_handledBy_fkey" FOREIGN KEY ("handledBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "deliveries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_items" ADD CONSTRAINT "delivery_items_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_logs" ADD CONSTRAINT "worker_logs_transactionItemId_fkey" FOREIGN KEY ("transactionItemId") REFERENCES "transaction_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_logs" ADD CONSTRAINT "worker_logs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_logs" ADD CONSTRAINT "worker_logs_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payrolls" ADD CONSTRAINT "payrolls_paidBy_fkey" FOREIGN KEY ("paidBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_ledger" ADD CONSTRAINT "cash_ledger_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_ledger" ADD CONSTRAINT "cash_ledger_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_ledger" ADD CONSTRAINT "cash_ledger_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "payrolls"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cash_ledger" ADD CONSTRAINT "cash_ledger_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
