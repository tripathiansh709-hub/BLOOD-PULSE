import { assertDonorAccess, bearer } from '@/server/auth';
import { handle, ok, parseBody, preflight } from '@/server/http';
import { UpdateDonorSchema } from '@/server/validators';
import { getDonor, updateDonor } from '@/server/services/donors';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

export const GET = handle<Ctx>(async (_req, { params }) => ok(await getDonor(params.id)));

export const PATCH = handle<Ctx>(async (req, { params }) => {
  await assertDonorAccess(bearer(req), params.id);
  const patch = await parseBody(req, UpdateDonorSchema);
  return ok(await updateDonor(params.id, patch));
});
