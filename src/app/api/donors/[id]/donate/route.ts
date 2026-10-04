import { assertDonorAccess, bearer } from '@/server/auth';
import { handle, ok, preflight } from '@/server/http';
import { completeDonation } from '@/server/services/donors';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

// POST /api/donors/:id/donate -> starts the 90-day cooldown, fulfils active relay channels
export const POST = handle<Ctx>(async (req, { params }) => {
  await assertDonorAccess(bearer(req), params.id);
  return ok(await completeDonation(params.id));
});
