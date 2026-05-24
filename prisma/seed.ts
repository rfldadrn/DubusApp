import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // === 1. ROLES ===
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

  const kasirRole = await prisma.role.upsert({
    where: { id: 3 },
    update: {},
    create: { id: 3, roleName: "Kasir" },
  });

  const produksiRole = await prisma.role.upsert({
    where: { id: 4 },
    update: {},
    create: { id: 4, roleName: "Produksi" },
  });

  console.log("✅ Roles seeded");

  // === 2. USERS ===
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

  await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      fullName: "Administrator",
      username: "admin",
      password: hashedPassword,
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { username: "kasir" },
    update: {},
    create: {
      fullName: "Kasir Toko",
      username: "kasir",
      password: hashedPassword,
      roleId: kasirRole.id,
    },
  });

  await prisma.user.upsert({
    where: { username: "produksi" },
    update: {},
    create: {
      fullName: "Staff Produksi",
      username: "produksi",
      password: hashedPassword,
      roleId: produksiRole.id,
    },
  });

  console.log("✅ Users seeded (all passwords: admin123)");

  // === 3. MENUS ===
  const menus = [
    { id: 1, menuName: "Dashboard", menuUrl: "/dashboard", menuIcon: "LayoutDashboard", menuSlug: "dashboard", isMenu: true, orderNo: 1, parentId: 0 },
    { id: 2, menuName: "Transaksi", menuUrl: "/dashboard/transactions", menuIcon: "ShoppingCart", menuSlug: "transactions", isMenu: true, orderNo: 2, parentId: 0 },
    { id: 3, menuName: "Pelanggan", menuUrl: "/dashboard/customers", menuIcon: "Users", menuSlug: "customers", isMenu: true, orderNo: 3, parentId: 0 },
    { id: 4, menuName: "Produksi", menuUrl: "/dashboard/production", menuIcon: "Factory", menuSlug: "production", isMenu: true, orderNo: 4, parentId: 0 },
    { id: 5, menuName: "Keuangan", menuUrl: "/dashboard/finance", menuIcon: "Wallet", menuSlug: "finance", isMenu: true, orderNo: 5, parentId: 0 },
    { id: 6, menuName: "Master Data", menuUrl: "/dashboard/master", menuIcon: "Database", menuSlug: "master", isMenu: true, orderNo: 7, parentId: 0 },
    { id: 7, menuName: "Laporan", menuUrl: "/dashboard/reports", menuIcon: "FileText", menuSlug: "reports", isMenu: true, orderNo: 8, parentId: 0 },
    { id: 8, menuName: "Pengaturan", menuUrl: "/dashboard/settings", menuIcon: "Settings", menuSlug: "settings", isMenu: true, orderNo: 9, parentId: 0 },
    { id: 9, menuName: "Buku Kas", menuUrl: "/dashboard/finance/cashbook", menuIcon: "BookOpen", menuSlug: "cashbook", isMenu: true, orderNo: 1, parentId: 5 },
    { id: 10, menuName: "Payroll", menuUrl: "/dashboard/finance/payroll", menuIcon: "HandCoins", menuSlug: "payroll", isMenu: true, orderNo: 2, parentId: 5 },
    { id: 11, menuName: "Agency", menuUrl: "/dashboard/agency", menuIcon: "Building2", menuSlug: "agency", isMenu: true, orderNo: 6, parentId: 0 },
    { id: 12, menuName: "Pengantaran", menuUrl: "/dashboard/delivery", menuIcon: "Truck", menuSlug: "delivery", isMenu: true, orderNo: 10, parentId: 0 },
  ];

  for (const menu of menus) {
    await prisma.menu.upsert({
      where: { id: menu.id },
      update: menu,
      create: menu,
    });
  }

  console.log("✅ Menus seeded");

  // === 4. ROLE MENU MAPPING ===
  // Clear existing mappings
  await prisma.roleMenuMapping.deleteMany({});

  // SuperAdmin: all menus (1-12)
  let mappingId = 1;
  for (let i = 1; i <= 12; i++) {
    await prisma.roleMenuMapping.create({
      data: { id: mappingId++, roleId: 1, menuId: i },
    });
  }

  // Administrator: Dashboard, Transaksi, Pelanggan, Produksi, Keuangan, Laporan, Kas, Payroll, Agency, Delivery
  const adminMenus = [1, 2, 3, 4, 5, 7, 9, 10, 11, 12];
  for (const menuId of adminMenus) {
    await prisma.roleMenuMapping.create({
      data: { id: mappingId++, roleId: 2, menuId },
    });
  }

  // Kasir: Dashboard, Transaksi, Pelanggan, Keuangan, Kas
  const kasirMenus = [1, 2, 3, 5, 9];
  for (const menuId of kasirMenus) {
    await prisma.roleMenuMapping.create({
      data: { id: mappingId++, roleId: 3, menuId },
    });
  }

  // Produksi: Dashboard, Produksi, Delivery
  const produksiMenus = [1, 4, 12];
  for (const menuId of produksiMenus) {
    await prisma.roleMenuMapping.create({
      data: { id: mappingId++, roleId: 4, menuId },
    });
  }

  console.log("✅ Role menu mappings seeded");

  // === 5. STATUS ITEM ===
  const statusItems = [
    { id: 1, code: "BARU", name: "Baru", description: "Order baru masuk", colorSlug: "blue", sequence: 1 },
    { id: 2, code: "POTONG", name: "Potong", description: "Sedang dipotong", colorSlug: "yellow", sequence: 2 },
    { id: 3, code: "JAHIT", name: "Jahit", description: "Sedang dijahit", colorSlug: "orange", sequence: 3 },
    { id: 4, code: "PSKC", name: "Pasang Kancing", description: "Pasang kancing & aksesori", colorSlug: "purple", sequence: 4 },
    { id: 5, code: "BORDIR", name: "Bordir", description: "Sedang dibordir (opsional)", colorSlug: "indigo", sequence: 5 },
    { id: 6, code: "GOSOK", name: "Gosok", description: "Sedang di-gosok/setrika", colorSlug: "pink", sequence: 6 },
    { id: 7, code: "PERMAK", name: "Permak", description: "Revisi/perbaikan", colorSlug: "red", sequence: 7 },
    { id: 8, code: "PENDING", name: "Pending", description: "Ditunda (menunggu bahan/ukuran)", colorSlug: "gray", sequence: 8 },
    { id: 9, code: "OK", name: "Selesai", description: "Sudah selesai, siap diambil", colorSlug: "green", sequence: 9 },
    { id: 10, code: "DIAMBIL", name: "Sudah Diambil", description: "Sudah diambil customer", colorSlug: "teal", sequence: 10 },
    { id: 11, code: "BU", name: "Belum Bayar", description: "Belum bayar lunas", colorSlug: "amber", sequence: 11 },
  ] as const;

  for (const status of statusItems) {
    await prisma.statusItem.upsert({
      where: { id: status.id },
      update: { ...status },
      create: status,
    });
  }

  console.log("✅ Status items seeded");

  // === 6. STATUS TRANSACTION ===
  const statusTransactions = [
    { id: 1, code: "NEW", name: "Baru", description: "Transaksi baru", colorSlug: "blue", sequence: 1 },
    { id: 2, code: "PROSES", name: "Proses", description: "Sedang dikerjakan", colorSlug: "yellow", sequence: 2 },
    { id: 3, code: "OK", name: "Selesai", description: "Semua item selesai", colorSlug: "green", sequence: 3 },
    { id: 4, code: "SELESAI", name: "Diserahkan", description: "Sudah diserahkan ke customer", colorSlug: "teal", sequence: 4 },
    { id: 5, code: "BB", name: "Belum Bayar", description: "Belum lunas", colorSlug: "red", sequence: 5 },
    { id: 6, code: "BTL", name: "Batal", description: "Transaksi dibatalkan", colorSlug: "gray", sequence: 6 },
    { id: 7, code: "PENDING", name: "Pending", description: "Ditunda", colorSlug: "orange", sequence: 7 },
  ] as const;

  for (const status of statusTransactions) {
    await prisma.statusTransaction.upsert({
      where: { id: status.id },
      update: { ...status },
      create: status,
    });
  }

  console.log("✅ Status transactions seeded");

  // === 7. EMPLOYEE TYPES ===
  const employeeTypes = [
    { id: 1, name: "Tukang Jahit", description: "Karyawan yang menjahit" },
    { id: 2, name: "Tukang Potong", description: "Karyawan yang memotong bahan" },
    { id: 3, name: "Admin", description: "Staff administrasi" },
    { id: 4, name: "Tukang Bordir", description: "Karyawan yang membordir" },
    { id: 5, name: "Tukang Gosok", description: "Karyawan setrika/gosok" },
  ];

  for (const type of employeeTypes) {
    await prisma.employeeType.upsert({
      where: { id: type.id },
      update: { ...type },
      create: type,
    });
  }

  console.log("✅ Employee types seeded");

  // === 8. EMPLOYEES ===
  const employees = [
    { id: 1, name: "Pak Budi", address: "Jl. Merpati No. 10", phoneNumber: "081234567001", gender: "Laki_laki" as const, employeeTypeId: 1, joinDate: new Date("2024-01-15") },
    { id: 2, name: "Bu Siti", address: "Jl. Kenanga No. 5", phoneNumber: "081234567002", gender: "Perempuan" as const, employeeTypeId: 1, joinDate: new Date("2024-02-01") },
    { id: 3, name: "Pak Andi", address: "Jl. Mawar No. 8", phoneNumber: "081234567003", gender: "Laki_laki" as const, employeeTypeId: 2, joinDate: new Date("2024-03-10") },
    { id: 4, name: "Bu Rina", address: "Jl. Melati No. 3", phoneNumber: "081234567004", gender: "Perempuan" as const, employeeTypeId: 1, joinDate: new Date("2024-04-20") },
    { id: 5, name: "Pak Joko", address: "Jl. Dahlia No. 12", phoneNumber: "081234567005", gender: "Laki_laki" as const, employeeTypeId: 2, joinDate: new Date("2024-05-01") },
    { id: 6, name: "Bu Dewi", address: "Jl. Anggrek No. 7", phoneNumber: "081234567006", gender: "Perempuan" as const, employeeTypeId: 4, joinDate: new Date("2024-06-15") },
    { id: 7, name: "Pak Hasan", address: "Jl. Tulip No. 2", phoneNumber: "081234567007", gender: "Laki_laki" as const, employeeTypeId: 5, joinDate: new Date("2024-07-01") },
  ];

  for (const emp of employees) {
    const { id, ...data } = emp;
    await prisma.employee.upsert({
      where: { id },
      update: { ...data },
      create: { id, ...data },
    });
  }

  console.log("✅ Employees seeded");

  // === 9. PAYMENT TYPES ===
  const paymentTypes = [
    { id: 1, code: "CASH", name: "Tunai", description: "Pembayaran tunai" },
    { id: 2, code: "TRANSFER", name: "Transfer Bank", description: "Transfer ke rekening" },
    { id: 3, code: "QRIS", name: "QRIS", description: "Pembayaran via QRIS" },
    { id: 4, code: "EDC", name: "Debit/Credit Card", description: "Kartu debit/kredit" },
  ];

  for (const type of paymentTypes) {
    await prisma.paymentType.upsert({
      where: { id: type.id },
      update: { ...type },
      create: type,
    });
  }

  console.log("✅ Payment types seeded");

  // === 10. ITEMS ===
  const items = [
    { id: 1, code: "KMJ", name: "Kemeja", category: "Atasan", genderTarget: "Pria" as const, customerPrice: 150000, employeePrice: 50000 },
    { id: 2, code: "CLN", name: "Celana", category: "Bawahan", genderTarget: "Unisex" as const, customerPrice: 120000, employeePrice: 40000 },
    { id: 3, code: "JAS", name: "Jas", category: "Formal", genderTarget: "Pria" as const, customerPrice: 500000, employeePrice: 200000 },
    { id: 4, code: "PDH", name: "PDH", category: "Dinas", genderTarget: "Unisex" as const, customerPrice: 200000, employeePrice: 75000 },
    { id: 5, code: "DRESS", name: "Dress", category: "Atasan", genderTarget: "Wanita" as const, customerPrice: 180000, employeePrice: 60000 },
    { id: 6, code: "ROK", name: "Rok", category: "Bawahan", genderTarget: "Wanita" as const, customerPrice: 100000, employeePrice: 35000 },
    { id: 7, code: "SAFARI", name: "Safari", category: "Formal", genderTarget: "Pria" as const, customerPrice: 250000, employeePrice: 90000 },
    { id: 8, code: "BLAZER", name: "Blazer", category: "Formal", genderTarget: "Unisex" as const, customerPrice: 350000, employeePrice: 150000 },
    { id: 9, code: "SERAGAM", name: "Seragam", category: "Dinas", genderTarget: "Unisex" as const, customerPrice: 175000, employeePrice: 60000 },
    { id: 10, code: "BATIK", name: "Batik", category: "Atasan", genderTarget: "Unisex" as const, customerPrice: 200000, employeePrice: 70000 },
  ];

  for (const item of items) {
    await prisma.item.upsert({
      where: { id: item.id },
      update: { ...item },
      create: item,
    });
  }

  console.log("✅ Items seeded");

  // === 11. WALLETS ===
  const wallets = [
    { id: 1, name: "Kas Tunai", walletType: "Cash" as const, openingBalance: 5000000, openingDate: new Date("2026-01-01"), isActive: true, notes: "Kas tunai untuk pembayaran langsung" },
    { id: 2, name: "QRIS Toko", walletType: "QRIS" as const, openingBalance: 0, openingDate: new Date("2026-01-01"), isActive: true, notes: "Pembayaran via QRIS" },
    { id: 3, name: "Bank BNI", walletType: "BankAccount" as const, bankName: "Bank BNI", accountNumber: "1234567890", openingBalance: 10000000, openingDate: new Date("2026-01-01"), isActive: true, notes: "Rekening bank untuk transfer" },
    { id: 4, name: "Bank BCA", walletType: "BankAccount" as const, bankName: "Bank BCA", accountNumber: "9876543210", openingBalance: 15000000, openingDate: new Date("2026-01-01"), isActive: true, notes: "Rekening bank untuk transfer" },
    { id: 5, name: "Bank Mandiri", walletType: "BankAccount" as const, bankName: "Bank Mandiri", accountNumber: "5555666677", openingBalance: 8000000, openingDate: new Date("2026-01-01"), isActive: true, notes: "Rekening bank untuk transfer" },
  ];

  for (const wallet of wallets) {
    await prisma.wallet.upsert({
      where: { id: wallet.id },
      update: { ...wallet },
      create: wallet,
    });
  }

  console.log("✅ Wallets seeded");

  // === 12. SEQUENCES ===
  await prisma.sequence.upsert({
    where: { key: "transaction" },
    update: {},
    create: { key: "transaction", lastNumber: 20 },
  });

  await prisma.sequence.upsert({
    where: { key: "delivery" },
    update: {},
    create: { key: "delivery", lastNumber: 0 },
  });

  console.log("✅ Sequences initialized");

  // === 13. AGENCIES ===
  const superAdminUser = await prisma.user.findFirst({ where: { username: "superadmin" } });
  const createdBy = superAdminUser!.id;

  const agencies = [
    { id: 1, agencyCode: "BKD", name: "Badan Kepegawaian Daerah", description: "Instansi BKD Kota", createdBy },
    { id: 2, agencyCode: "DIKNAS", name: "Dinas Pendidikan", description: "Dinas Pendidikan Kab.", createdBy },
    { id: 3, agencyCode: "DINKES", name: "Dinas Kesehatan", description: "Dinas Kesehatan Kota", createdBy },
    { id: 4, agencyCode: "SETDA", name: "Sekretariat Daerah", description: "Setda Kota", createdBy },
  ];

  for (const agency of agencies) {
    await prisma.agency.upsert({
      where: { id: agency.id },
      update: { ...agency },
      create: agency,
    });
  }

  console.log("✅ Agencies seeded");

  // === 14. AGENCY PROJECTS ===
  const agencyProjects = [
    { id: 1, projectCode: "BKD-2026-001", agencyId: 1, name: "Seragam Dinas 2026", picName: "Pak Ahmad", picPhone: "08111222333", startDate: new Date("2026-01-15"), targetDate: new Date("2026-06-30"), contractStatus: "Active" as const },
    { id: 2, projectCode: "DIKNAS-2026-001", agencyId: 2, name: "Seragam Guru 2026", picName: "Bu Lestari", picPhone: "08222333444", startDate: new Date("2026-02-01"), targetDate: new Date("2026-07-31"), contractStatus: "Active" as const },
  ];

  for (const proj of agencyProjects) {
    await prisma.agencyProject.upsert({
      where: { id: proj.id },
      update: { ...proj },
      create: proj,
    });
  }

  console.log("✅ Agency projects seeded");

  // === 15. CUSTOMERS ===
  const customers = [
    { id: 1, name: "Ahmad Fauzi", phoneNumber: "081234560001", gender: "Laki_laki" as const, agencyId: null },
    { id: 2, name: "Siti Nurhaliza", phoneNumber: "081234560002", gender: "Perempuan" as const, agencyId: null },
    { id: 3, name: "Bambang Suryono", phoneNumber: "081234560003", gender: "Laki_laki" as const, agencyId: 1 },
    { id: 4, name: "Dewi Sartika", phoneNumber: "081234560004", gender: "Perempuan" as const, agencyId: 1 },
    { id: 5, name: "Rudi Hartono", phoneNumber: "081234560005", gender: "Laki_laki" as const, agencyId: 1 },
    { id: 6, name: "Ani Widyastuti", phoneNumber: "081234560006", gender: "Perempuan" as const, agencyId: 2 },
    { id: 7, name: "Deni Hermawan", phoneNumber: "081234560007", gender: "Laki_laki" as const, agencyId: 2 },
    { id: 8, name: "Fitri Handayani", phoneNumber: "081234560008", gender: "Perempuan" as const, agencyId: null },
    { id: 9, name: "Gunawan Wibisono", phoneNumber: "081234560009", gender: "Laki_laki" as const, agencyId: null },
    { id: 10, name: "Hesti Rahayu", phoneNumber: "081234560010", gender: "Perempuan" as const, agencyId: null },
    { id: 11, name: "Irfan Maulana", phoneNumber: "081234560011", gender: "Laki_laki" as const, agencyId: 3 },
    { id: 12, name: "Juwita Sari", phoneNumber: "081234560012", gender: "Perempuan" as const, agencyId: 3 },
    { id: 13, name: "Kurniawan", phoneNumber: "081234560013", gender: "Laki_laki" as const, agencyId: null },
    { id: 14, name: "Linda Permata", phoneNumber: "081234560014", gender: "Perempuan" as const, agencyId: null },
    { id: 15, name: "Muhammad Rizal", phoneNumber: "081234560015", gender: "Laki_laki" as const, agencyId: 4 },
  ];

  for (const cust of customers) {
    await prisma.customer.upsert({
      where: { id: cust.id },
      update: { ...cust },
      create: cust,
    });
  }

  console.log("✅ Customers seeded");

  // === 16. TRANSACTIONS ===
  const transactions = [
    // Regular customers
    { id: 1, transactionCode: "TRX-202605-0001", customerId: 1, type: "Regular" as const, transactionDate: new Date("2026-05-01"), totalAmount: 270000, paymentStatus: "Paid" as const, statusTransactionId: 3, createdBy, note: "Order kemeja dan celana" },
    { id: 2, transactionCode: "TRX-202605-0002", customerId: 2, type: "Regular" as const, transactionDate: new Date("2026-05-02"), totalAmount: 180000, paymentStatus: "Partial" as const, statusTransactionId: 2, createdBy, note: "Order dress" },
    { id: 3, transactionCode: "TRX-202605-0003", customerId: 8, type: "Regular" as const, transactionDate: new Date("2026-05-03"), totalAmount: 500000, paymentStatus: "Unpaid" as const, statusTransactionId: 1, createdBy, note: "Order jas formal" },
    { id: 4, transactionCode: "TRX-202605-0004", customerId: 9, type: "Regular" as const, transactionDate: new Date("2026-05-05"), totalAmount: 250000, paymentStatus: "Paid" as const, statusTransactionId: 4, createdBy, note: "Order safari" },
    { id: 5, transactionCode: "TRX-202605-0005", customerId: 10, type: "Regular" as const, transactionDate: new Date("2026-05-07"), totalAmount: 350000, paymentStatus: "Unpaid" as const, statusTransactionId: 2, createdBy, note: "Order blazer wanita" },
    // Agency customers
    { id: 6, transactionCode: "TRX-202605-0006", customerId: 3, agencyProjectId: 1, type: "Agency" as const, transactionDate: new Date("2026-05-01"), totalAmount: 400000, paymentStatus: "Unpaid" as const, statusTransactionId: 2, createdBy, note: "Seragam BKD - Bambang" },
    { id: 7, transactionCode: "TRX-202605-0007", customerId: 4, agencyProjectId: 1, type: "Agency" as const, transactionDate: new Date("2026-05-01"), totalAmount: 375000, paymentStatus: "Unpaid" as const, statusTransactionId: 2, createdBy, note: "Seragam BKD - Dewi" },
    { id: 8, transactionCode: "TRX-202605-0008", customerId: 5, agencyProjectId: 1, type: "Agency" as const, transactionDate: new Date("2026-05-01"), totalAmount: 400000, paymentStatus: "Unpaid" as const, statusTransactionId: 1, createdBy, note: "Seragam BKD - Rudi" },
    { id: 9, transactionCode: "TRX-202605-0009", customerId: 6, agencyProjectId: 2, type: "Agency" as const, transactionDate: new Date("2026-05-03"), totalAmount: 350000, paymentStatus: "Partial" as const, statusTransactionId: 2, createdBy, note: "Seragam Guru - Ani" },
    { id: 10, transactionCode: "TRX-202605-0010", customerId: 7, agencyProjectId: 2, type: "Agency" as const, transactionDate: new Date("2026-05-03"), totalAmount: 200000, paymentStatus: "Unpaid" as const, statusTransactionId: 1, createdBy, note: "Seragam Guru - Deni" },
    // More regular
    { id: 11, transactionCode: "TRX-202605-0011", customerId: 13, type: "Regular" as const, transactionDate: new Date("2026-05-08"), totalAmount: 150000, paymentStatus: "Paid" as const, statusTransactionId: 3, createdBy, note: "Order kemeja" },
    { id: 12, transactionCode: "TRX-202605-0012", customerId: 14, type: "Regular" as const, transactionDate: new Date("2026-05-09"), totalAmount: 280000, paymentStatus: "Partial" as const, statusTransactionId: 2, createdBy, note: "Order dress + rok" },
    { id: 13, transactionCode: "TRX-202605-0013", customerId: 1, type: "Regular" as const, transactionDate: new Date("2026-05-10"), totalAmount: 200000, paymentStatus: "Unpaid" as const, statusTransactionId: 1, createdBy, note: "Order batik" },
  ];

  for (const trx of transactions) {
    await prisma.transaction.upsert({
      where: { id: trx.id },
      update: { ...trx },
      create: trx,
    });
  }

  console.log("✅ Transactions seeded");

  // === 17. TRANSACTION ITEMS ===
  const transactionItemsList = [
    // TRX 1 - Ahmad: Kemeja + Celana (selesai)
    { id: 1, transactionId: 1, itemId: 1, sewingPrice: 150000, statusItemId: 9, assignedTailorId: 1, targetDate: new Date("2026-05-15") },
    { id: 2, transactionId: 1, itemId: 2, sewingPrice: 120000, statusItemId: 9, assignedTailorId: 1, targetDate: new Date("2026-05-15") },
    // TRX 2 - Siti: Dress (dalam proses jahit)
    { id: 3, transactionId: 2, itemId: 5, sewingPrice: 180000, statusItemId: 3, assignedTailorId: 2, targetDate: new Date("2026-05-20") },
    // TRX 3 - Fitri: Jas (baru)
    { id: 4, transactionId: 3, itemId: 3, sewingPrice: 500000, statusItemId: 1, assignedTailorId: null, targetDate: new Date("2026-06-01") },
    // TRX 4 - Gunawan: Safari (selesai, diambil)
    { id: 5, transactionId: 4, itemId: 7, sewingPrice: 250000, statusItemId: 10, assignedTailorId: 1, targetDate: new Date("2026-05-12") },
    // TRX 5 - Hesti: Blazer (sedang potong)
    { id: 6, transactionId: 5, itemId: 8, sewingPrice: 350000, statusItemId: 2, assignedTailorId: 3, targetDate: new Date("2026-05-25") },
    // TRX 6 - Bambang BKD: PDH + Celana (proses)
    { id: 7, transactionId: 6, itemId: 4, sewingPrice: 200000, statusItemId: 3, assignedTailorId: 2, targetDate: new Date("2026-06-15") },
    { id: 8, transactionId: 6, itemId: 2, sewingPrice: 120000, statusItemId: 4, assignedTailorId: 2, targetDate: new Date("2026-06-15") },
    // Extra charge to make total 400000 handled via charges
    // TRX 7 - Dewi BKD: PDH + Rok
    { id: 9, transactionId: 7, itemId: 4, sewingPrice: 200000, statusItemId: 2, assignedTailorId: 4, targetDate: new Date("2026-06-15") },
    { id: 10, transactionId: 7, itemId: 6, sewingPrice: 100000, statusItemId: 2, assignedTailorId: 4, targetDate: new Date("2026-06-15") },
    // TRX 8 - Rudi BKD: PDH + Celana (baru)
    { id: 11, transactionId: 8, itemId: 4, sewingPrice: 200000, statusItemId: 1, assignedTailorId: null, targetDate: new Date("2026-06-15") },
    { id: 12, transactionId: 8, itemId: 2, sewingPrice: 120000, statusItemId: 1, assignedTailorId: null, targetDate: new Date("2026-06-15") },
    // TRX 9 - Ani Guru: Seragam + Rok
    { id: 13, transactionId: 9, itemId: 9, sewingPrice: 175000, statusItemId: 6, assignedTailorId: 1, targetDate: new Date("2026-06-30") },
    { id: 14, transactionId: 9, itemId: 6, sewingPrice: 100000, statusItemId: 3, assignedTailorId: 2, targetDate: new Date("2026-06-30") },
    // TRX 10 - Deni Guru: PDH
    { id: 15, transactionId: 10, itemId: 4, sewingPrice: 200000, statusItemId: 1, assignedTailorId: null, targetDate: new Date("2026-07-15") },
    // TRX 11 - Kurniawan: Kemeja (selesai)
    { id: 16, transactionId: 11, itemId: 1, sewingPrice: 150000, statusItemId: 9, assignedTailorId: 4, targetDate: new Date("2026-05-15") },
    // TRX 12 - Linda: Dress + Rok
    { id: 17, transactionId: 12, itemId: 5, sewingPrice: 180000, statusItemId: 4, assignedTailorId: 2, targetDate: new Date("2026-05-22") },
    { id: 18, transactionId: 12, itemId: 6, sewingPrice: 100000, statusItemId: 3, assignedTailorId: 4, targetDate: new Date("2026-05-22") },
    // TRX 13 - Ahmad: Batik (baru)
    { id: 19, transactionId: 13, itemId: 10, sewingPrice: 200000, statusItemId: 1, assignedTailorId: null, targetDate: new Date("2026-05-28") },
  ];

  for (const item of transactionItemsList) {
    await prisma.transactionItem.upsert({
      where: { id: item.id },
      update: { ...item },
      create: item,
    });
  }

  console.log("✅ Transaction items seeded");

  // === 18. TRANSACTION ITEM CHARGES ===
  const charges = [
    { id: 1, transactionItemId: 7, label: "Kain tambahan", amount: 50000, note: "Kain extra untuk PDH" },
    { id: 2, transactionItemId: 8, label: "Kancing khusus", amount: 30000, note: "Kancing logo BKD" },
    { id: 3, transactionItemId: 9, label: "Kain tambahan", amount: 50000, note: "Kain extra" },
    { id: 4, transactionItemId: 10, label: "Bordir logo", amount: 25000, note: "Logo instansi" },
    { id: 5, transactionItemId: 13, label: "Bordir nama", amount: 25000, note: "Nama + NIP" },
    { id: 6, transactionItemId: 14, label: "Bordir nama", amount: 25000, note: "Nama + NIP" },
  ];

  for (const charge of charges) {
    await prisma.transactionItemCharge.upsert({
      where: { id: charge.id },
      update: { ...charge },
      create: charge,
    });
  }

  console.log("✅ Transaction item charges seeded");

  // === 19. PAYMENTS ===
  const adminUser = await prisma.user.findFirst({ where: { username: "admin" } });
  const receivedBy = adminUser!.id;

  const payments = [
    { id: 1, transactionId: 1, amount: 270000, balanceAfter: 0, paymentTypeId: 1, walletId: 1, receivedBy, note: "Lunas", paidAt: new Date("2026-05-01") },
    { id: 2, transactionId: 2, amount: 100000, balanceAfter: 80000, paymentTypeId: 1, walletId: 1, receivedBy, note: "DP", paidAt: new Date("2026-05-02") },
    { id: 3, transactionId: 4, amount: 250000, balanceAfter: 0, paymentTypeId: 2, walletId: 3, receivedBy, note: "Lunas via transfer", paidAt: new Date("2026-05-05") },
    { id: 4, transactionId: 9, amount: 200000, balanceAfter: 150000, paymentTypeId: 3, walletId: 2, receivedBy, note: "DP via QRIS", paidAt: new Date("2026-05-03") },
    { id: 5, transactionId: 11, amount: 150000, balanceAfter: 0, paymentTypeId: 1, walletId: 1, receivedBy, note: "Lunas", paidAt: new Date("2026-05-08") },
    { id: 6, transactionId: 12, amount: 150000, balanceAfter: 130000, paymentTypeId: 1, walletId: 1, receivedBy, note: "DP", paidAt: new Date("2026-05-09") },
  ];

  for (const payment of payments) {
    await prisma.payment.upsert({
      where: { id: payment.id },
      update: { ...payment },
      create: payment,
    });
  }

  console.log("✅ Payments seeded");

  // === 20. PRODUCTION LOGS ===
  const productionLogs = [
    { id: 1, transactionItemId: 1, fromStatusId: 1, toStatusId: 2, notes: "Mulai potong", updatedBy: createdBy },
    { id: 2, transactionItemId: 1, fromStatusId: 2, toStatusId: 3, notes: "Mulai jahit", updatedBy: createdBy },
    { id: 3, transactionItemId: 1, fromStatusId: 3, toStatusId: 9, notes: "Selesai", updatedBy: createdBy },
    { id: 4, transactionItemId: 3, fromStatusId: 1, toStatusId: 2, notes: "Mulai potong", updatedBy: createdBy },
    { id: 5, transactionItemId: 3, fromStatusId: 2, toStatusId: 3, notes: "Mulai jahit", updatedBy: createdBy },
    { id: 6, transactionItemId: 6, fromStatusId: 1, toStatusId: 2, notes: "Mulai potong", updatedBy: createdBy },
    { id: 7, transactionItemId: 13, fromStatusId: 1, toStatusId: 6, notes: "Masuk gosok", updatedBy: createdBy },
  ];

  for (const log of productionLogs) {
    await prisma.productionLog.upsert({
      where: { id: log.id },
      update: { ...log },
      create: log,
    });
  }

  console.log("✅ Production logs seeded");

  // === 21. WORKER LOGS ===
  const workerLogs = [
    { id: 1, transactionItemId: 1, employeeId: 3, role: "Cutter" as const, upah: 15000, isPaid: true },
    { id: 2, transactionItemId: 1, employeeId: 1, role: "Tailor" as const, upah: 50000, isPaid: true },
    { id: 3, transactionItemId: 2, employeeId: 3, role: "Cutter" as const, upah: 12000, isPaid: true },
    { id: 4, transactionItemId: 2, employeeId: 1, role: "Tailor" as const, upah: 40000, isPaid: true },
    { id: 5, transactionItemId: 3, employeeId: 5, role: "Cutter" as const, upah: 18000, isPaid: false },
    { id: 6, transactionItemId: 3, employeeId: 2, role: "Tailor" as const, upah: 60000, isPaid: false },
    { id: 7, transactionItemId: 5, employeeId: 3, role: "Cutter" as const, upah: 27000, isPaid: true },
    { id: 8, transactionItemId: 5, employeeId: 1, role: "Tailor" as const, upah: 90000, isPaid: true },
    { id: 9, transactionItemId: 6, employeeId: 3, role: "Cutter" as const, upah: 45000, isPaid: false },
  ];

  for (const log of workerLogs) {
    await prisma.workerLog.upsert({
      where: { id: log.id },
      update: { ...log },
      create: log,
    });
  }

  console.log("✅ Worker logs seeded");

  // === 22. IRONING LOGS ===
  const ironingLogs = [
    { id: 1, transactionItemId: 13, ironingType: "External" as const, sentAt: new Date("2026-05-10"), returnedAt: null, handledBy: createdBy, notes: "Dikirim ke pasar" },
  ];

  for (const log of ironingLogs) {
    const { id, ...data } = log;
    // Check if already exists
    const existing = await prisma.ironingLog.findUnique({ where: { transactionItemId: data.transactionItemId } });
    if (!existing) {
      await prisma.ironingLog.create({ data: { id, ...data } });
    }
  }

  console.log("✅ Ironing logs seeded");

  // === 23. FABRICS ===
  const fabrics = [
    { id: 1, name: "Drill Premium", fabricType: "Drill", pricePerMeter: 85000, stockMeters: 100 },
    { id: 2, name: "Katun Oxford", fabricType: "Katun", pricePerMeter: 65000, stockMeters: 80 },
    { id: 3, name: "Polyester Twill", fabricType: "Polyester", pricePerMeter: 45000, stockMeters: 150 },
    { id: 4, name: "Linen Italy", fabricType: "Linen", pricePerMeter: 120000, stockMeters: 30 },
    { id: 5, name: "Wool Blend", fabricType: "Wool", pricePerMeter: 200000, stockMeters: 20 },
    { id: 6, name: "Satin", fabricType: "Satin", pricePerMeter: 75000, stockMeters: 50 },
  ];

  for (const fabric of fabrics) {
    await prisma.fabric.upsert({
      where: { id: fabric.id },
      update: { ...fabric },
      create: fabric,
    });
  }

  console.log("✅ Fabrics seeded");

  console.log("\n🎉 Seeding completed!");
  console.log("📋 Login credentials:");
  console.log("   SuperAdmin: superadmin / admin123 (all menus)");
  console.log("   Admin:      admin / admin123 (limited menus)");
  console.log("   Kasir:      kasir / admin123 (transactions & finance)");
  console.log("   Produksi:   produksi / admin123 (production only)");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
