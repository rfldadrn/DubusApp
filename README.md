# 🧵 Toko Jahit App - Production Ready

Aplikasi manajemen toko jahit modern berbasis **Next.js 15**, **Prisma**, **PostgreSQL**, dan **NextAuth v5**.

## ✨ Fitur Utama

### ✅ Sudah Diimplementasikan
- **Authentication & Authorization** - NextAuth v5 dengan role-based access control
- **Dashboard Modern** - Statistik real-time dan analytics
- **Workflow Tracker Visual** - Timeline produksi yang modern dan interaktif
- **UI Components** - shadcn/ui style components (Button, Card, Table, Badge, Toast, dll)
- **Database Schema Lengkap** - Prisma schema untuk semua entitas bisnis
- **Responsive Design** - Mobile-friendly dengan Tailwind CSS
- **TypeScript Strict Mode** - Type-safe codebase
- **Production Build** - ✅ Sudah tested dan berhasil build

### 📋 Modul yang Sudah Disiapkan
1. **Dashboard** - Overview dan quick stats
2. **Transaksi** - Order management & pembayaran
3. **Pelanggan** - CRM dan ukuran pelanggan
4. **Produksi** - Workflow tracking & monitoring
5. **Keuangan** - Kas, piutang, dan pembayaran
6. **Master Data** - Items, status, karyawan, payment types
7. **Laporan** - Reports dan analytics
8. **Pengaturan** - User management & konfigurasi

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 14+
- npm atau pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment Variables
Copy file `.env.example` menjadi `.env` dan sesuaikan:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# Database - Sesuaikan dengan PostgreSQL Anda
DATABASE_URL="postgresql://postgres:password@localhost:5432/toko_jahit"

# NextAuth - Generate secret dengan: npx auth secret
AUTH_SECRET="your-super-secret-key-min-32-chars"
AUTH_URL="http://localhost:3000"

# App Config
NEXT_PUBLIC_APP_NAME="Toko Jahit App"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Setup Database

#### Generate Prisma Client
```bash
npm run db:generate
```

#### Create Database & Run Migrations
```bash
npm run db:push
```

#### Seed Initial Data
```bash
npm run db:seed
```

Data seed mencakup:
- ✅ 2 Roles: SuperAdmin & Administrator
- ✅ 2 Users: `superadmin` & `admin` (password: `admin123`)
- ✅ Menu dan role mappings
- ✅ Status items & transactions (configurable)
- ✅ Employee types
- ✅ Payment types
- ✅ Sample items (Kemeja, Celana, Jas, PDH, Dress)

### 4. Run Development Server
```bash
npm run dev
```

Aplikasi berjalan di [http://localhost:3000](http://localhost:3000)

### 5. Login
```
Username: superadmin
Password: admin123

atau

Username: admin
Password: admin123
```

## 📁 Struktur Project

```
dubusApp/
├── prisma/
│   ├── schema.prisma         # Database schema lengkap
│   └── seed.ts               # Initial data seeding
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── auth/         # NextAuth API routes
│   │   ├── dashboard/        # Dashboard pages
│   │   │   ├── customers/    # Manajemen pelanggan
│   │   │   ├── transactions/ # Manajemen transaksi
│   │   │   ├── production/   # Monitoring produksi
│   │   │   ├── finance/      # Keuangan
│   │   │   ├── master/       # Master data
│   │   │   ├── reports/      # Laporan
│   │   │   └── settings/     # Pengaturan
│   │   ├── login/            # Login page
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Root redirect
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   └── shared/           # Shared components (Sidebar, StatusBadge, WorkflowTracker)
│   ├── lib/
│   │   ├── auth.ts           # NextAuth configuration
│   │   ├── prisma.ts         # Prisma client singleton
│   │   ├── payment.ts        # Payment helpers
│   │   └── utils.ts          # Utility functions
│   ├── types/
│   │   └── next-auth.d.ts    # NextAuth type extensions
│   └── middleware.ts         # Route protection & role-based access
├── .env.example              # Environment template
├── next.config.ts            # Next.js configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies & scripts
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev              # Start dev server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:seed          # Seed initial data
npm run db:studio        # Open Prisma Studio
npm run db:reset         # Reset database
npm run db:backup        # Backup database ke file lokal (.dump)
npm run db:backup:gdrive # Backup database + upload ke Google Drive

# Build & Production
npm run build            # Build for production
npm run start            # Start production server
npm run type-check       # TypeScript type checking
npm run lint             # Run ESLint
```

## Backup Database ke Google Drive

Fitur ini membuat dump PostgreSQL (.dump), menyimpan ke folder lokal, lalu upload ke Google Drive.

Penting: script membaca environment dari file `.env` (dan `.env.local` jika ada). File `.env.example` hanya template.

### 1. Siapkan Service Account Google

1. Buka Google Cloud Console, aktifkan Google Drive API.
2. Buat Service Account dan generate key JSON.
3. Simpan key JSON (misal: `./secrets/gdrive-service-account.json`).
4. Jika upload ke folder tertentu, share folder Google Drive ke email service account (Editor).

### 2. Atur Environment Variable

Tambahkan di `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/toko_jahit"
DIRECT_URL="postgresql://postgres:password@localhost:5432/toko_jahit"

BACKUP_DIR="backups"
BACKUP_KEEP_DAYS="14"
BACKUP_FILE_PREFIX="dubusapp_"
PG_DUMP_PATH=""

GDRIVE_SERVICE_ACCOUNT_FILE="./secrets/gdrive-service-account.json"
GDRIVE_FOLDER_ID=""
GDRIVE_KEEP_FILES="30"
```

Catatan credential (pilih satu):
- `GDRIVE_SERVICE_ACCOUNT_FILE`
- `GDRIVE_SERVICE_ACCOUNT_JSON`
- `GDRIVE_SERVICE_ACCOUNT_BASE64`
- atau OAuth user credential: `GDRIVE_OAUTH_CLIENT_ID`, `GDRIVE_OAUTH_CLIENT_SECRET`, `GDRIVE_OAUTH_REFRESH_TOKEN`
- alternatif OAuth file: `GDRIVE_OAUTH_CLIENT_FILE` + `GDRIVE_OAUTH_REFRESH_TOKEN`

Jika `pg_dump` belum ada di PATH, isi `PG_DUMP_PATH` dengan lokasi executable.

Jika muncul error `Service Accounts do not have storage quota`:
- Gunakan folder di Shared Drive dan set `GDRIVE_FOLDER_ID`, atau
- Beralih ke OAuth user credentials agar upload memakai kuota akun Google Anda.

### Generate OAuth Refresh Token (One-Time)

1. Isi dulu di `.env`:

```env
GDRIVE_OAUTH_CLIENT_ID="..."
GDRIVE_OAUTH_CLIENT_SECRET="..."
GDRIVE_OAUTH_REDIRECT_URI="http://localhost"
# atau langsung file OAuth dari Google Cloud
GDRIVE_OAUTH_CLIENT_FILE="./cerdentials/client_secret_xxx.apps.googleusercontent.com.json"
```

2. Jalankan helper:

```bash
npm run db:gdrive:oauth-token
```

3. Buka URL yang ditampilkan, login akun Google Anda, lalu copy authorization code.
4. Paste code ke terminal. Script akan menampilkan `GDRIVE_OAUTH_REFRESH_TOKEN`.
5. Simpan token itu ke `.env`, lalu jalankan ulang:

```bash
npm run db:backup:gdrive
```

Jika muncul error `has not completed the Google verification process`:

1. Buka Google Cloud Console -> APIs & Services -> OAuth consent screen.
2. Set `Publishing status` ke `Testing` (bukan In production).
3. Tambahkan email Anda di `Test users`.
4. Di `.env`, gunakan scope minimal:

```env
GDRIVE_OAUTH_SCOPES="https://www.googleapis.com/auth/drive.file"
```

5. Generate ulang refresh token:

```bash
npm run db:gdrive:oauth-token
```

### 3. Jalankan Backup

```bash
npm run db:backup:gdrive
```

### 4. Jalankan Otomatis Harian (Windows Task Scheduler)

Default task dijalankan setiap hari jam 01:00:

```bash
npm run db:backup:schedule
```

Jika ingin test command pendaftaran task tanpa benar-benar membuat task:

```bash
powershell -ExecutionPolicy Bypass -File scripts/register-backup-task.ps1 -WhatIf
```

Jika ingin custom jam, contoh jam 02:30:

```bash
powershell -ExecutionPolicy Bypass -File scripts/register-backup-task.ps1 -Time "02:30"
```

Hapus task scheduler:

```bash
npm run db:backup:unschedule
```

Output proses:
- File backup lokal dibuat di folder `BACKUP_DIR`
- File di-upload ke Google Drive
- File lokal lama dibersihkan berdasarkan `BACKUP_KEEP_DAYS`
- File lama di Drive dibersihkan berdasarkan `GDRIVE_KEEP_FILES` (jika `GDRIVE_FOLDER_ID` diisi)

## Quick Guide Menjalankan Fitur Backup

1. Copy `.env.example` ke `.env` lalu isi nilai koneksi database + credential Google Drive.
2. Pastikan service account sudah diberi akses ke folder Drive tujuan.
3. Coba manual dulu: `npm run db:backup:gdrive`.
4. Jika sudah sukses, aktifkan scheduler: `npm run db:backup:schedule`.
5. Cek log hasil scheduler di `logs/db-backup-gdrive.log`.

## Mode Vercel Cron (Hobby 1x/hari)

Jika aplikasi di-host di Vercel, gunakan cron bawaan Vercel untuk trigger harian.

Penting:
- Endpoint cron ada di `/api/cron/db-backup`.
- Jadwal diset di `vercel.json`.
- Vercel tidak ideal untuk menjalankan `pg_dump` langsung, jadi endpoint ini men-trigger backup runner lewat webhook (`BACKUP_WEBHOOK_URL`).

### Konfigurasi

1. Pastikan file `vercel.json` berisi cron:

```json
{
  "crons": [
    {
      "path": "/api/cron/db-backup",
      "schedule": "0 1 * * *"
    }
  ]
}
```

2. Tambahkan Environment Variables di Vercel Project:

```env
CRON_SECRET="random-secret"
BACKUP_WEBHOOK_URL="https://your-backup-runner.example.com/backup"
BACKUP_WEBHOOK_TOKEN="optional-webhook-token"
```

3. Backup runner adalah service yang menjalankan command:

```bash
npm run db:backup:gdrive
```

4. Deploy ke Vercel. Cron akan memanggil endpoint harian dengan `Authorization: Bearer <CRON_SECRET>`.

### Test Manual Endpoint Cron

```bash
curl -X GET "https://your-domain.vercel.app/api/cron/db-backup" \
  -H "Authorization: Bearer <CRON_SECRET>"
```

## Checklist Push ke Git

Push file berikut:
- source code dan script:
  - `scripts/backup-to-gdrive.ts`
  - `scripts/generate-gdrive-refresh-token.ts`
  - `scripts/register-backup-task.ps1`
  - `src/app/api/cron/db-backup/route.ts`
  - `vercel.json`
- konfigurasi project:
  - `.gitignore`
  - `.env.example`
  - `README.md`
  - `package.json`
  - `package-lock.json`

Jangan push:
- `.env`
- folder `cerdentials/`
- folder `backups/`
- folder `logs/`

Catatan:
- Jika ada file lain yang berubah tapi tidak terkait fitur backup (misalnya perubahan modul lain), commit terpisah supaya riwayat tetap bersih.

## Yang Perlu Disediakan di Vercel

Wajib untuk endpoint cron:
- `CRON_SECRET`
- `BACKUP_WEBHOOK_URL`
- `BACKUP_WEBHOOK_TOKEN` (opsional)

Untuk aplikasi utama (umum NextAuth + DB):
- `DATABASE_URL`
- `DIRECT_URL` (jika dipakai di server action/script)
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXT_PUBLIC_APP_NAME`
- `NEXT_PUBLIC_APP_URL`

Untuk backup runner (jika runner juga Anda deploy sendiri, bukan di Vercel app utama):
- `DATABASE_URL` atau `DIRECT_URL`
- `BACKUP_DIR`
- `BACKUP_KEEP_DAYS`
- `BACKUP_FILE_PREFIX`
- `PG_DUMP_PATH` (jika pg_dump tidak ada di PATH)
- `GDRIVE_FOLDER_ID` (direkomendasikan)
- `GDRIVE_KEEP_FILES`
- OAuth mode (direkomendasikan):
  - `GDRIVE_OAUTH_CLIENT_FILE` atau pasangan `GDRIVE_OAUTH_CLIENT_ID` + `GDRIVE_OAUTH_CLIENT_SECRET`
  - `GDRIVE_OAUTH_REFRESH_TOKEN`
  - `GDRIVE_OAUTH_REDIRECT_URI`
  - `GDRIVE_OAUTH_SCOPES`

## 🎨 UI Components

Aplikasi menggunakan **shadcn/ui** style components:
- ✅ Button
- ✅ Input
- ✅ Label
- ✅ Card
- ✅ Table
- ✅ Badge
- ✅ Toast/Toaster
- ✅ Dialog (siap pakai)
- ✅ Select (siap pakai)
- ✅ Tabs (siap pakai)
- ✅ Dropdown Menu (siap pakai)

## 🔐 Authentication & Authorization

### Roles
1. **SuperAdmin** - Full access ke semua fitur
2. **Administrator** - Limited access (dashboard, transactions, customers, production, reports)

### Protected Routes
Semua route di `/dashboard/*` dilindungi oleh middleware dengan role-based access control.

### User Management
Users dapat dikelola melalui halaman Settings (hanya SuperAdmin).

## 💾 Database Schema Highlights

### Core Entities
- `User`, `Role`, `Menu`, `RoleMenuMapping` - Auth & authorization
- `Customer`, `HeaderSizeCustomer`, `ItemSizeCustomer` - Customer & ukuran
- `Transaction`, `TransactionItem`, `TransactionItemCharge` - Order management
- `Payment`, `CashLedger`, `Wallet` - Financial management
- `StatusItem`, `StatusTransaction` - Configurable status workflow
- `Employee`, `EmployeeType`, `WorkerLog`, `Payroll` - HR & payroll
- `ProductionLog`, `IroningLog` - Production tracking
- `Delivery`, `DeliveryItem` - Delivery management
- `Agency`, `AgencyProject` - Corporate client management
- `Item`, `ItemSize`, `Fabric` - Product catalog
- `Sequence` - Atomic transaction code generation
- `AuditLog` - Audit trail

### Key Features
- ✅ Configurable status (admin bisa edit tanpa deploy)
- ✅ Atomic sequence generation (no collision)
- ✅ Comprehensive audit logging
- ✅ Multi-wallet cash management
- ✅ Agency/corporate project tracking
- ✅ Complete production workflow
- ✅ Flexible sizing system per item type

## 🎯 Workflow Tracker

Fitur unggulan: **Visual workflow tracker** yang menampilkan status produksi secara real-time dengan:
- ✅ Progress bar animasi
- ✅ Color-coded status badges
- ✅ Timeline view yang interaktif
- ✅ Real-time status updates

Contoh penggunaan:
```tsx
<WorkflowTracker 
  steps={workflowSteps} 
  title="Status Produksi" 
/>
```

## 📊 Dashboard Features

- **Real-time Stats** - Total transaksi, pelanggan, piutang, produksi
- **Recent Transactions** - 5 transaksi terakhir dengan quick view
- **Quick Actions** - Shortcut untuk operasi umum
- **Workflow Example** - Demo visual workflow tracker

## 🔧 Customization

### Warna Status
Edit di `src/lib/utils.ts` fungsi `getStatusColor`:
```typescript
const colors = {
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  // ... tambah warna lain
};
```

### Status Items
Status bisa dikonfigurasi dari database (tabel `status_items` dan `status_transactions`). Admin bisa menambah/edit status tanpa perlu deploy ulang.

### Menu & Role Access
Konfigurasi menu dan akses role di:
- Database: tables `menus`, `role_menu_mappings`
- Code: `src/middleware.ts` (ROLE_ACCESS)

## 🚀 Deployment

### Build Production
```bash
npm run build
```

### Deploy ke Vercel (Recommended)
```bash
vercel
```

### Deploy ke Server
```bash
# Build
npm run build

# Start production
npm start
```

### Environment Variables Production
Pastikan set semua environment variables di production:
- `DATABASE_URL`
- `AUTH_SECRET` (generate baru untuk production!)
- `AUTH_URL` (URL production)

## 📝 Next Steps / Roadmap

### Priority 1 (Core Features)
- [ ] Implement full CRUD untuk Transaksi
- [ ] Implement full CRUD untuk Pelanggan & Ukuran
- [ ] Production workflow management (update status)
- [ ] Payment processing & recording
- [ ] Print nota/invoice

### Priority 2 (Business Logic)
- [ ] Automatic status calculation
- [ ] Worker assignment & payroll calculation
- [ ] Stock & fabric management
- [ ] Delivery scheduling

### Priority 3 (Advanced)
- [ ] Reports & analytics dengan charts
- [ ] WhatsApp notification integration
- [ ] File upload (model images)
- [ ] Export PDF/Excel reports
- [ ] Backup & restore

## 🐛 Known Issues & Solutions

### Prisma Client Cache
Jika ada error `Property 'statusItem' does not exist`:
```bash
# Clear dan regenerate
rm -rf node_modules/.prisma
npm run db:generate
```

### Build Warnings
Beberapa warnings `@typescript-eslint/no-explicit-any` adalah acceptable untuk compatibility dengan NextAuth types dan dapat diabaikan.

## 📞 Support

Untuk pertanyaan atau issue:
1. Check dokumentasi SETUP.md (file existing)
2. Review schema di `prisma/schema.prisma`
3. Check seed data di `prisma/seed.ts`

## 📄 License

Private project - All rights reserved

## 🙏 Credits

Built with:
- [Next.js 15](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js v5](https://next-auth.js.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)

Pass GCP : 
Yk`)=;rNFSl&Ul\8

---

**Status:** ✅ Production Ready  
**Build Status:** ✅ Passing  
**Last Updated:** May 2026
