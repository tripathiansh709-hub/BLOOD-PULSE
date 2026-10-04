import { z } from 'zod';
import { calculateCooldown } from '@/lib/compatibility';
import { ScreeningSchema } from '../validators';

/** Preliminary self-screening (NBTC-style thresholds). Not a medical diagnosis. */
export function screenDonor(input: z.infer<typeof ScreeningSchema>) {
  const reasons: string[] = [];
  if (input.age < 18) reasons.push('Donors must be at least 18 years old.');
  if (input.age > 65) reasons.push('Donors must be 65 or younger.');
  if (input.weightKg < 45) reasons.push('Minimum body weight is 45 kg.');
  if (input.hemoglobin !== undefined && input.hemoglobin < 12.5) {
    reasons.push('Hemoglobin must be at least 12.5 g/dL.');
  }
  if (!input.feelingWell) reasons.push('You should be in good health on the day of donation.');
  if (input.recentTattooSurgeryOrTransfusion) {
    reasons.push('Wait 6 months after a tattoo, major surgery or transfusion.');
  }
  const cooldown = calculateCooldown(input.lastDonationDate ?? null);
  if (!cooldown.isEligible) {
    reasons.push(`Last donation was too recent — ${cooldown.daysRemaining} day(s) of the 90-day cooldown remain.`);
  }
  return {
    eligible: reasons.length === 0,
    reasons,
    cooldown,
    disclaimer: 'Preliminary screening only. Final eligibility is decided by the collection centre medical staff.',
  };
}
