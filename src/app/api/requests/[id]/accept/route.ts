import { assertDonorAccess, assertSeekerAccess, bearer } from '@/server/auth';
import { handle, ok, parseBody, preflight } from '@/server/http';
import { AcceptRequestSchema } from '@/server/validators';
import { acceptRequest } from '@/server/services/requests';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

// POST /api/requests/:id/accept { donorId, actor: "DONOR" | "SEEKER" }
// DONOR  = the donor tapped "Accept" in their portal / alert
// SEEKER = the seeker picked a matched donor in the wizard ("Initiate Secure Contact")
export const POST = handle<Ctx>(async (req, { params }) => {
  const { donorId, actor } = await parseBody(req, AcceptRequestSchema);
  if (actor === 'DONOR') await assertDonorAccess(bearer(req), donorId);
  else await assertSeekerAccess(bearer(req), params.id);
  return ok(await acceptRequest(params.id, donorId), 201);
});
