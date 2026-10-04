import { assertDonorAccess, bearer } from '@/server/auth';
import { handle, ok, preflight } from '@/server/http';
import { listDonorAlerts } from '@/server/services/donors';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

export const GET = handle<Ctx>(async (req, { params }) => {
  await assertDonorAccess(bearer(req), params.id);
  return ok(await listDonorAlerts(params.id));
});
