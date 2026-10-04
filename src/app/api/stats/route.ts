import { handle, ok, preflight } from '@/server/http';
import { getStats } from '@/server/services/stats';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

export const GET = handle(async () => ok(await getStats()));
