import { handle, ok, parseBody, parseQuery, preflight } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { ListDonorsQuery, RegisterDonorSchema } from '@/server/validators';
import { listDonors, registerDonor } from '@/server/services/donors';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

// GET /api/donors?bloodType=O-&status=AVAILABLE&lat=28.57&lng=77.21&radiusKm=10
export const GET = handle(async (req) => {
  return ok(await listDonors(parseQuery(req, ListDonorsQuery)));
});

// POST /api/donors  -> registers a donor, returns a one-time accessToken
export const POST = handle(async (req) => {
  rateLimit(req, 'donor-register', 5, 60_000);
  const body = await parseBody(req, RegisterDonorSchema);
  return ok(await registerDonor(body), 201);
});
