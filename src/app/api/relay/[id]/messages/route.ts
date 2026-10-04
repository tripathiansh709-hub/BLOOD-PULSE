import { db } from '@/server/db';
import { assertDonorAccess, assertSeekerAccess, bearer } from '@/server/auth';
import { ApiError, handle, ok, parseBody, preflight } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { SendMessageSchema } from '@/server/validators';
import { sendMessage } from '@/server/services/relay';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

// POST /api/relay/:id/messages { sender: "DONOR" | "SEEKER", text }
export const POST = handle<Ctx>(async (req, { params }) => {
  rateLimit(req, 'relay-message', 30, 60_000);
  const { sender, text } = await parseBody(req, SendMessageSchema);

  const ch = await db.relayChannel.findUnique({
    where: { id: params.id },
    select: { donorId: true, requestId: true },
  });
  if (!ch) throw new ApiError(404, 'Relay channel not found', 'NOT_FOUND');

  if (sender === 'DONOR') await assertDonorAccess(bearer(req), ch.donorId);
  else await assertSeekerAccess(bearer(req), ch.requestId);

  return ok(await sendMessage(params.id, sender, text), 201);
});
