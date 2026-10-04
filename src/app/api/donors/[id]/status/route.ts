import { assertDonorAccess, bearer } from '@/server/auth';
import { handle, ok, parseBody, preflight } from '@/server/http';
import { SetStatusSchema } from '@/server/validators';
import { setDonorStatus } from '@/server/services/donors';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

// POST /api/donors/:id/status  { "status": "AVAILABLE" | "STANDBY" | "OFFLINE" }
export const POST = handle<Ctx>(async (req, { params }) => {
  await assertDonorAccess(bearer(req), params.id);
  const { status } = await parseBody(req, SetStatusSchema);
  return ok(await setDonorStatus(params.id, status));
});
