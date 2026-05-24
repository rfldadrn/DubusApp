# Setup Sprint 1 — Toko Jahit App

## 1. Buat Project Next.js

```bash
npx create-next-app@latest toko-jahit --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd toko-jahit
```

## 2. Install Dependencies

```bash
# Database & ORM
npm install prisma @prisma/client

# Auth
npm install next-auth@beta @auth/prisma-adapter

# Utilities
npm install bcryptjs
npm install -D @types/bcryptjs
```

## 3. Init Prisma

```bash
npx prisma init
```

Lalu copy `schema.prisma` yang sudah disiapkan ke folder `prisma/`.

## 4. Environment Variables

Buat file `.env` di root project:

```env
# PostgreSQL di GCP
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL="postgresql://postgres:yourpassword@xx.xx.xx.xx:5432/toko_jahit"

# NextAuth
AUTH_SECRET="generate-dengan-perintah-di-bawah"
AUTH_URL="http://localhost:3000"
```

Generate AUTH_SECRET:
```bash
npx auth secret
# atau manual:
openssl rand -base64 32
```

## 5. Migrasi Database

```bash
# Buat migrasi pertama
npx prisma migrate dev --name init

# Lihat DB di browser (opsional)
npx prisma studio
```

## 6. Seed Data Awal

```bash
npx prisma db seed
```

(File seed ada di `prisma/seed.ts`)

## 7. Jalankan Dev Server

```bash
npm run dev
```

---

## Struktur Folder yang Disarankan

```
src/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← cek session di sini
│   │   ├── dashboard/
│   │   ├── customers/
│   │   ├── transactions/
│   │   ├── master/
│   │   └── reports/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts
├── lib/
│   ├── auth.ts                 ← config NextAuth
│   ├── prisma.ts               ← prisma client singleton
│   └── utils.ts
├── components/
│   ├── ui/                     ← shadcn/ui components
│   └── shared/
└── middleware.ts               ← proteksi route berdasarkan role
```

---

## Checklist GCP PostgreSQL

Pastikan sebelum koneksi:
- [ ] Cloud SQL instance sudah running (PostgreSQL 15+)
- [ ] Database `toko_jahit` sudah dibuat
- [ ] User & password sudah di-set
- [ ] IP laptop/server di-whitelist di authorized networks
- [ ] Port 5432 terbuka
- [ ] Test koneksi: `psql -h IP -U postgres -d toko_jahit`
