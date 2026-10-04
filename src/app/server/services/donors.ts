import { db } from '../db';
import { ApiError } from '../http';
import { encrypt, maskPhone, newToken, normalizePhone } from '../crypto';
import { toDonor, toPublicDonor } from '../mappers';
import { publish } from '../events';
import { calculateCooldown, calculateDistanceKm, COOLDOWN_DAYS } from '@/lib/compatibility';
import type { DonorStatus, EmergencyNotification, BloodGroup, UrgencyLevel } from '@/types';
import { z } from 'zod';
import { RegisterDonorSchema, UpdateDonorSchema, ListDonorsQuery } from '../validators';

const DAY = 24 * 60 * 60 * 1000;

/** Auto-release donors whose 90-day cooldown has ended. Called before reads/matching. */
export async function refreshCooldowns() {
  await db.donor.updateMany({
    where: { status: 'RECENTLY_DONATED', cooldownUntil: { lte: new Date() } },
    data: { status: 'AVAILABLE', cooldownUntil: null },
  });
}

/** "Priya Mehta" -> "Priya M." (public listings never show full surnames) */
function abbreviateName(full: string) {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

async function uniqueMaskedCode() {
  for (let i = 0; i < 10; i++) {
    const code = `DX-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await db.donor.findUnique({ where: { maskedCode: code } }))) return code;
  }
  throw new ApiError(500, 'Could not allocate donor code');
}

export async function registerDonor(input: z.infer<typeof RegisterDonorSchema>) {
  const phone = normalizePhone(input.phone);
  const last = input.lastDonationDate ? new Date(input.lastDonationDate) : null;
  const cd = calculateCooldown(last ? last.toISOString() : null);
  const { token, hash } = newToken();

  const row = await db.donor.create({
    data: {
      maskedCode: await uniqueMaskedCode(),
      name: abbreviateName(input.name),
      phoneEnc: encrypt(phone),
      phoneMasked: maskPhone(phone),
      tokenHash: hash,
      bloodType: input.bloodType,
      status: cd.isEligible ? 'AVAILABLE' : 'RECENTLY_DONATED',
      city: input.city,
      pincode: input.pincode,
      lat: input.lat,
      lng: input.lng,
      lastDonationDate: last,
      cooldownUntil: cd.isEligible || !cd.cooldownDate ? null : new Date(cd.cooldownDate),
    },
  });
  // accessToken is shown ONCE. Only its hash is stored.
  return { donor: toDonor(row), accessToken: token };
}

export async function listDonors(query: z.infer<typeof ListDonorsQuery>) {
  await refreshCooldowns();
  const rows = await db.donor.findMany({
    where: {
      bloodType: query.bloodType,
      status: query.status,
      city: query.city ? { equals: query.city } : undefined,
    },
    orderBy: { totalDonations: 'desc' },
    take: query.lat !== undefined && query.lng !== undefined ? 500 : query.limit,
  });
  let donors = rows.map(toDonor);
  if (query.lat !== undefined && query.lng !== undefined) {
    const { lat, lng, radiusKm } = query;
    donors = donors.filter((d) => calculateDistanceKm(lat, lng, d.lat, d.lng) <= radiusKm).slice(0, query.limit);
  }
  return donors.map(toPublicDonor);
}

export async function getDonor(id: string) {
  await refreshCooldowns();
  const row = await db.donor.findUnique({ where: { id } });
  if (!row) throw new ApiError(404, 'Donor not found', 'NOT_FOUND');
  return toDonor(row);
}

export async function updateDonor(id: string, patch: z.infer<typeof UpdateDonorSchema>) {
  const { phone, ...rest } = patch;
  const data: Record<string, unknown> = { ...rest };
  if (phone) {
    const p = normalizePhone(phone);
    data.phoneEnc = encrypt(p);
    data.phoneMasked = maskPhone(p);
  }
  const row = await db.donor.update({ where: { id }, data });
  return toDonor(row);
}

export async function setDonorStatus(id: string, status: DonorStatus) {
  await refreshCooldowns();
  const donor = await db.donor.findUnique({ where: { id } });
  if (!donor) throw new ApiError(404, 'Donor not found', 'NOT_FOUND');

  const inCooldown = donor.cooldownUntil && donor.cooldownUntil > new Date();
  if (inCooldown && (status === 'AVAILABLE' || status === 'STANDBY')) {
    throw new ApiError(409, `Donor is in the ${COOLDOWN_DAYS}-day safety cooldown`, 'COOLDOWN_ACTIVE');
  }
  if (status === 'RECENTLY_DONATED') {
    throw new ApiError(400, 'RECENTLY_DONATED is set automatically when a donation is completed', 'INVALID_STATUS');
  }
  return toDonor(await db.donor.update({ where: { id }, data: { status } }));
}

/**
 * Records a completed donation: starts the 90-day cooldown, bumps the counter,
 * fulfils the donor's active relay channels and the requests they were matched to.
 */
export async function completeDonation(donorId: string) {
  const donor = await db.donor.findUnique({ where: { id: donorId } });
  if (!donor) throw new ApiError(404, 'Donor not found', 'NOT_FOUND');
  if (donor.cooldownUntil && donor.cooldownUntil > new Date()) {
    throw new ApiError(409, 'Donor is already in cooldown', 'COOLDOWN_ACTIVE');
  }

  const now = new Date();
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.donor.update({
      where: { id: donorId },
      data: {
        status: 'RECENTLY_DONATED',
        lastDonationDate: now,
        cooldownUntil: new Date(now.getTime() + COOLDOWN_DAYS * DAY),
        totalDonations: { increment: 1 },
      },
    });

    const channels = await tx.relayChannel.findMany({ where: { donorId, status: 'ACTIVE' } });
    for (const ch of channels) {
      await tx.relayChannel.update({ where: { id: ch.id }, data: { status: 'FULFILLED' } });
      await tx.message.create({
        data: {
          channelId: ch.id,
          sender: 'SYSTEM',
          senderMaskedName: 'BloodPulse Protocol',
          text: 'Donation successfully verified! 90-day biological safety cooldown activated. Channel fulfilled.',
        },
      });
      await tx.bloodRequest.updateMany({
        where: { id: ch.requestId, status: 'MATCHED' },
        data: { status: 'FULFILLED' },
      });
    }
    return { updated, channelIds: channels.map((c) => c.id), requestIds: channels.map((c) => c.requestId) };
  });

  result.channelIds.forEach((id) => publish(`channel:${id}`, { type: 'DONATION_COMPLETED', payload: { donorId } }));
  result.requestIds.forEach((id) => publish(`request:${id}`, { type: 'DONATION_COMPLETED', payload: { donorId } }));
  return toDonor(result.updated);
}

/** Open emergencies this donor has been dispatched to (drives the donor alert feed). */
export async function listDonorAlerts(donorId: string): Promise<EmergencyNotification[]> {
  const donor = await db.donor.findUnique({ where: { id: donorId } });
  if (!donor) throw new ApiError(404, 'Donor not found', 'NOT_FOUND');
  const dispatches = await db.dispatch.findMany({
    where: { donorId, request: { status: { in: ['ACTIVE', 'DISPATCHED'] } } },
    include: { request: true },
    orderBy: { createdAt: 'desc' },
  });
  return dispatches.map((d) => ({
    id: `alert-${d.id}`,
    requestId: d.requestId,
    hospitalName: d.request.hospitalName,
    hospitalAddress: d.request.hospitalAddress,
    bloodType: d.request.recipientBloodType as BloodGroup,
    unitsRequired: d.request.unitsRequired,
    urgency: d.request.urgency as UrgencyLevel,
    distanceKm: d.distanceKm,
    createdAt: d.request.createdAt.toISOString(),
  }));
}

