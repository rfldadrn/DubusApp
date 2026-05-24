import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log("Checking Prisma client models...");
console.log("prisma.statusItem:", prisma.statusItem ? "✅ EXISTS" : "❌ MISSING");
console.log("prisma.statusTransaction:", prisma.statusTransaction ? "✅ EXISTS" : "❌ MISSING");

// Check all available models
const models = Object.keys(prisma).filter(key => !key.startsWith('_') && !key.startsWith('$') && typeof (prisma as any)[key] === 'object');
console.log("\nAll available models:", models.sort());

prisma.$disconnect();
