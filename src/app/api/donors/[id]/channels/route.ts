import { assertDonorAccess, bearer } from '@/server/auth';
import { handle, ok, preflight } from '@/server/http';
import { listChannelsForDonor } from '@/server/services/relay';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

export const GET = handle<Ctx>(async (req, { params }) => {
  await assertDonorAccess(bearer(req), params.id);
  return ok(await listChannelsForDonor(params.id));
});
