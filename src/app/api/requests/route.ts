import { handle, ok, parseBody, parseQuery, preflight } from '@/server/http';
import { rateLimit } from '@/server/rateLimit';
import { CreateRequestSchema, ListRequestsQuery } from '@/server/validators';
import { createRequest, listRequests } from '@/server/services/requests';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

export const GET = handle(async (req) => {
  const { status, limit } = parseQuery(req, ListRequestsQuery);
  return ok(await listRequests(status, limit));
});

// POST /api/requests -> creates the emergency, auto-matches donors, pushes live alerts
export const POST = handle(async (req) => {
  rateLimit(req, 'request-create', 5, 60_000);
  const body = await parseBody(req, CreateRequestSchema);
  return ok(await createRequest(body), 201);
});
