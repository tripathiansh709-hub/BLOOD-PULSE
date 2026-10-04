import { handle, ok, parseQuery, preflight } from '@/server/http';
import { toPublicDonor } from '@/server/mappers';
import { MatchQuery } from '@/server/validators';
import { findMatches } from '@/server/services/requests';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

// GET /api/matches?recipientBloodType=B+&lat=28.56&lng=77.21&urgency=IMMEDIATE  (preview, creates nothing)
export const GET = handle(async (req) => {
  const q = parseQuery(req, MatchQuery);
  const matches = await findMatches(q.recipientBloodType, q.lat, q.lng, q.urgency, q.radiusKm);
  return ok(matches.map((m) => ({ ...m, donor: toPublicDonor(m.donor) })));
});
