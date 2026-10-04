import { PrismaClient } from '@prisma/client';

// One PrismaClient per process (avoids exhausting connections during Next.js hot reload).
const g = globalThis as unknown as { __prisma?: PrismaClient };

export const db = g.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') g.__prisma = db;
