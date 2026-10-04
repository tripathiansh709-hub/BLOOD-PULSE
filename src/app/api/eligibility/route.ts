import { z } from 'zod';
import { handle, ok, parseBody, parseQuery, preflight } from '@/server/http';
import { ScreeningSchema } from '@/server/validators';
import { screenDonor } from '@/server/services/eligibility';
import { calculateCooldown } from '@/lib/compatibility';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

// GET /api/eligibility?lastDonationDate=2026-08-01T00:00:00.000Z -> cooldown progress
export const GET = handle(async (req) => {
  const { lastDonationDate } = parseQuery(req, z.object({ lastDonationDate: z.string().datetime().optional() }));
  return ok(calculateCooldown(lastDonationDate ?? null));
});

// POST /api/eligibility -> self-screening questionnaire
export const POST = handle(async (req) => ok(screenDonor(await parseBody(req, ScreeningSchema))));
