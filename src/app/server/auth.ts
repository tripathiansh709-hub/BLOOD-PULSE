import type { NextRequest } from 'next/server';
import { db } from './db';
import { ApiError } from './http';
import { hashToken, safeEqual } from './crypto';

const strict = () => process.env.AUTH_MODE === 'strict';

export function bearer(req: NextRequest): string | null {
  const h = req.headers.get('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7).trim() : null;
}

const unauthorized = (who: string) => new ApiError(401, `Valid ${who} access token required`, 'UNAUTHORIZED');

/** Donor-owned actions: only the donor's own token passes in strict mode. */
export async function assertDonorAccess(token: string | null, donorId: string) {
  if (!strict()) return;
  const donor = await db.donor.findUnique({ where: { id: donorId }, select: { tokenHash: true } });
  if (!token || !donor?.tokenHash || !safeEqual(hashToken(token), donor.tokenHash)) throw unauthorized('donor');
}

/** Seeker-owned actions: the token returned when the request was created. */
export async function assertSeekerAccess(token: string | null, requestId: string) {
  if (!strict()) return;
  const r = await db.bloodRequest.findUnique({ where: { id: requestId }, select: { seekerTokenHash: true } });
  if (!token || !r?.seekerTokenHash || !safeEqual(hashToken(token), r.seekerTokenHash)) throw unauthorized('seeker');
}

/** Either party of a relay channel (donor or seeker) may pass. */
export async function assertParticipant(token: string | null, donorId: string, requestId: string) {
  if (!strict()) return;
  try {
    await assertDonorAccess(token, donorId);
  } catch {
    await assertSeekerAccess(token, requestId);
  }
}
