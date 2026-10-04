import { assertSeekerAccess, bearer } from '@/server/auth';
import { handle, ok, preflight } from '@/server/http';
import { cancelRequest } from '@/server/services/requests';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

export const POST = handle<Ctx>(async (req, { params }) => {
  await assertSeekerAccess(bearer(req), params.id);
  return ok(await cancelRequest(params.id));
});
