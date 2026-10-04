import { handle, ok, preflight } from '@/server/http';
import { getRequestMatches } from '@/server/services/requests';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

export const GET = handle<Ctx>(async (_req, { params }) => ok(await getRequestMatches(params.id)));
