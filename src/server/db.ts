import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Vercel's filesystem is read-only except /tmp, so on Vercel we copy the bundled, pre-seeded
// SQLite file (prisma/seed.db) to /tmp and point Prisma at it. Data written there is EPHEMERAL
// (lost on cold start) — fine for a demo. For real persistence, switch to Postgres
// (see README / the notes in prisma/schema.prisma).
function prepareDatabaseUrl() {
  if (!process.env.VERCEL) return;
  const target = '/tmp/blood-pulse.db';
  try {
    if (!fs.existsSync(target)) {
      fs.copyFileSync(path.join(process.cwd(), 'prisma', 'seed.db'), target);
    }
    process.env.DATABASE_URL = `file:${target}`;
  } catch (e) {
    console.error('Could not prepare SQLite database in /tmp', e);
  }
}

// One PrismaClient per process (avoids exhausting connections during Next.js hot reload).
const g = globalThis as unknown as { __prisma?: PrismaClient };

if (!g.__prisma) prepareDatabaseUrl();

export const db = g.__prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') g.__prisma = db;
