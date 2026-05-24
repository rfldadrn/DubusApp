# 🚀 Quick Setup Guide - Toko Jahit App

## Step-by-Step Setup (5 Menit)

### 1️⃣ Setup Environment
```bash
# Copy environment template
copy .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/toko_jahit"
AUTH_SECRET="your-32-char-random-secret-here"
AUTH_URL="http://localhost:3000"
```

**Generate AUTH_SECRET:**
```bash
npx auth secret
# atau
openssl rand -base64 32
```

### 2️⃣ Setup Database

**Create database di PostgreSQL:**
```sql
CREATE DATABASE toko_jahit;
```

**Generate Prisma Client:**
```bash
npm run db:generate
```

**Push schema ke database:**
```bash
npm run db:push
```

**Seed data awal:**
```bash
npm run db:seed
```

### 3️⃣ Run Application
```bash
npm run dev
```

### 4️⃣ Login
Buka [http://localhost:3000/login](http://localhost:3000/login)

**Default Users:**
```
SuperAdmin:
Username: superadmin
Password: admin123

Administrator:
Username: admin
Password: admin123
```

## 🎯 Quick Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Build for production
npm run start                  # Start production server

# Database
npm run db:generate            # Generate Prisma Client
npm run db:push                # Push schema to DB
npm run db:migrate             # Create migration (production)
npm run db:seed                # Seed initial data
npm run db:studio              # Open Prisma Studio (DB viewer)
npm run db:reset               # Reset database (WARNING: delete all data!)

# Code Quality
npm run type-check             # TypeScript check
npm run lint                   # ESLint check
```

## 📁 Project Structure Quick Reference

```
src/
├── app/
│   ├── api/auth/              # NextAuth API
│   ├── dashboard/             # Main app pages
│   ├── login/                 # Login page
│   └── layout.tsx             # Root layout
├── components/
│   ├── ui/                    # Reusable UI components
│   └── shared/                # Shared app components
├── lib/
│   ├── auth.ts                # Auth config
│   ├── prisma.ts              # Prisma client
│   ├── payment.ts             # Payment helpers
│   └── utils.ts               # Utilities
└── middleware.ts              # Route protection
```

## 🐛 Troubleshooting

### Error: "Can't connect to database"
- ✅ Check PostgreSQL is running
- ✅ Check DATABASE_URL in .env is correct
- ✅ Check database exists (`CREATE DATABASE toko_jahit;`)
- ✅ Check user & password is correct

### Error: "Property 'statusItem' does not exist"
```bash
# Clear cache dan regenerate
rm -rf node_modules/.prisma
npm run db:generate
```

### Error: "AUTH_SECRET is not set"
```bash
# Generate new secret
npx auth secret
# Copy ke .env file
```

### Build Warnings (Safe to Ignore)
- `@typescript-eslint/no-explicit-any` - TypeScript compatibility warnings
- Node.js API warnings - NextAuth v5 compatibility

## 📊 What's Included

✅ **Authentication** - Login dengan role-based access  
✅ **Dashboard** - Stats & overview  
✅ **Visual Workflow Tracker** - Production timeline  
✅ **30+ Database Models** - Complete business schema  
✅ **Modern UI** - shadcn/ui components  
✅ **TypeScript** - Full type safety  
✅ **Responsive Design** - Mobile-friendly  

## 🎯 Next Steps

1. ✅ Login ke aplikasi
2. ✅ Explore dashboard
3. ✅ Check Prisma Studio (`npm run db:studio`)
4. ⏭️ Implement CRUD features per module
5. ⏭️ Customize sesuai kebutuhan

## 🔗 Useful Links

- **Prisma Studio:** Run `npm run db:studio` → [http://localhost:5555](http://localhost:5555)
- **App:** [http://localhost:3000](http://localhost:3000)
- **API Docs:** [http://localhost:3000/api/auth](http://localhost:3000/api/auth)

## 💡 Pro Tips

1. **Use Prisma Studio** untuk explore & edit data manual
2. **Check schema.prisma** untuk understand database structure
3. **Check seed.ts** untuk lihat initial data yang di-seed
4. **Use TypeScript types** yang di-generate Prisma untuk type safety
5. **Backup database** sebelum run `db:reset`!

## ⚠️ Important Notes

- **DEFAULT PASSWORDS** harus diganti di production!
- **AUTH_SECRET** harus unique dan secure di production!
- **DATABASE_URL** jangan di-commit ke git!
- **Seed data** hanya untuk development/testing!

---

**Need Help?**
- 📖 Read: README.md (full documentation)
- 📊 Status: PROJECT_STATUS.md (what's built)
- 📝 Original: SETUP.md (original setup guide)

**Happy Coding! 🚀**
