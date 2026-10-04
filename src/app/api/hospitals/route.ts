import { db } from '@/server/db';
import { handle, ok, preflight } from '@/server/http';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

export const GET = handle(async () => {
  const hospitals = await db.hospital.findMany({ orderBy: { name: 'asc' } });
  return ok(hospitals);
});
