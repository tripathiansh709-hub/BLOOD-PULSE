import { db } from '@/server/db';
import { handle, ok } from '@/server/http';

export const dynamic = 'force-dynamic';

export const GET = handle(async () => {
  await db.$queryRaw`SELECT 1`;
  return ok({ status: 'healthy', time: new Date().toISOString() });
});
