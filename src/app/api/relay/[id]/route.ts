import { assertParticipant, bearer } from '@/server/auth';
import { handle, ok, preflight } from '@/server/http';
import { getChannel } from '@/server/services/relay';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;
type Ctx = { params: { id: string } };

export const GET = handle<Ctx>(async (req, { params }) => {
  const channel = await getChannel(params.id);
  await assertParticipant(bearer(req), channel.donorId, channel.requestId);
  return ok(channel);
});
