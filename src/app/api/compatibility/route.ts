import { z } from 'zod';
import { handle, ok, parseQuery, preflight } from '@/server/http';
import { BloodGroupSchema } from '@/server/validators';
import { BLOOD_GROUP_INFO, RBC_CAN_DONATE_TO, RBC_COMPATIBILITY } from '@/lib/compatibility';

export const dynamic = 'force-dynamic';
export const OPTIONS = preflight;

const Q = z.object({ recipient: BloodGroupSchema.optional(), donor: BloodGroupSchema.optional() });

// GET /api/compatibility                -> full matrix
// GET /api/compatibility?recipient=A+   -> who can give to A+
// GET /api/compatibility?donor=O-       -> who O- can give to
export const GET = handle(async (req) => {
  const { recipient, donor } = parseQuery(req, Q);
  if (recipient) {
    return ok({ recipient, compatibleDonors: RBC_COMPATIBILITY[recipient], info: BLOOD_GROUP_INFO[recipient] });
  }
  if (donor) {
    return ok({ donor, canDonateTo: RBC_CAN_DONATE_TO[donor], info: BLOOD_GROUP_INFO[donor] });
  }
  return ok({ receives: RBC_COMPATIBILITY, donatesTo: RBC_CAN_DONATE_TO, info: BLOOD_GROUP_INFO });
});
