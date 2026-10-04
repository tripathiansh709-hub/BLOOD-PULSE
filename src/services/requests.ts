import { z } from 'zod';
import { db } from '../db';
import { ApiError } from '../http';
import { newToken } from '../crypto';
import { publish } from '../events';
import { toChannel, toDonor, toPublicDonor, toRequest } from '../mappers';
import { refreshCooldowns } from './donors';
import { CreateRequestSchema } from '../validators';
import { RBC_COMPATIBILITY, findMatchingDonors } from '@/lib/compatibility';
import type { BloodGroup, EmergencyNotification, TransfusionMatchResult, UrgencyLevel } from '@/types';

const DAY = 24 * 60 * 60 * 1000;

/** Rank compatible, eligible, nearby donors (reuses the UI's own matching algorithm). */
export async function findMatches(
  recipient: BloodGroup,
  lat: number,
  lng: number,
  urgency: UrgencyLevel,
  radiusKm = 50
): Promise<TransfusionMatchResult[]> {
  await refreshCooldowns();
  const rows = await db.donor.findMany({
    where: { bloodType: { in: RBC_COMPATIBILITY[recipient] }, status: { not: 'OFFLINE' } },
  });
  return findMatchingDonors(recipient, lat, lng, urgency, rows.map(toDonor), radiusKm);
}

export async function createRequest(input: z.infer<typeof CreateRequestSchema>) {
  // Resolve hospital: either by id or from explicit fields (what the current UI sends).
  let name = input.hospitalName;
  let address = input.hospitalAddress;
  let lat = input.hospitalLat;
  let lng = input.hospitalLng;
  let contactPhone = input.contactMaskedPhone;

  if (input.hospitalId) {
    const h = await db.hospital.findUnique({ where: { id: input.hospitalId } });
    if (!h) throw new ApiError(404, 'Hospital not found', 'NOT_FOUND');
    name = h.name;
    address = h.address;
    lat = h.lat;
    lng = h.lng;
    contactPhone = contactPhone ?? h.emergencyPhoneMasked;
  }
  if (!name || !address || lat === undefined || lng === undefined) {
    throw new ApiError(400, 'Provide hospitalId or hospitalName, hospitalAddress, hospitalLat, hospitalLng', 'VALIDATION_ERROR');
  }

  const matches = await findMatches(input.recipientBloodType, lat, lng, input.urgency, 50);
  const { token, hash } = newToken();

  const created = await db.bloodRequest.create({
    data: {
      id: input.id,
      patientName: input.patientName,
      patientId: input.patientId,
      recipientBloodType: input.recipientBloodType,
      hospitalName: name,
      hospitalAddress: address,
      hospitalLat: lat,
      hospitalLng: lng,
      urgency: input.urgency,
      unitsRequired: input.unitsRequired,
      prescriptionVerified: input.prescriptionVerified,
      prescriptionFileName: input.prescriptionFileName,
      status: matches.length > 0 ? 'DISPATCHED' : 'ACTIVE',
      contactName: input.contactName,
      contactMaskedPhone: contactPhone ?? 'Hidden',
      seekerTokenHash: hash,
      dispatches: {
        create: matches.map((m) => ({
          donorId: m.donor.id,
          distanceKm: m.distanceKm,
          matchScore: m.matchScore,
          etaMinutes: m.etaMinutes,
        })),
      },
    },
    include: { dispatches: true },
  });

  // Real-time alert to every dispatched donor who is currently AVAILABLE.
  for (const m of matches) {
    if (m.donor.status !== 'AVAILABLE') continue;
    const alert: EmergencyNotification = {
      id: `alert-${created.id}-${m.donor.id}`,
      requestId: created.id,
      hospitalName: name,
      hospitalAddress: address,
      bloodType: input.recipientBloodType,
      unitsRequired: input.unitsRequired,
      urgency: input.urgency,
      distanceKm: m.distanceKm,
      createdAt: created.createdAt.toISOString(),
    };
    publish(`donor:${m.donor.id}`, { type: 'EMERGENCY_ALERT', payload: alert });
  }

  return {
    request: toRequest(created),
    matches: matches.map((m) => ({ ...m, donor: toPublicDonor(m.donor) })),
    seekerToken: token, // shown once; send as `Authorization: Bearer <token>` in strict mode
  };
}

export async function listRequests(status?: string, limit = 50) {
  const rows = await db.bloodRequest.findMany({
    where: status ? { status } : undefined,
    include: { dispatches: { select: { donorId: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toRequest);
}

export async function getRequest(id: string) {
  const row = await db.bloodRequest.findUnique({
    where: { id },
    include: { dispatches: { select: { donorId: true } } },
  });
  if (!row) throw new ApiError(404, 'Request not found', 'NOT_FOUND');
  return toRequest(row);
}

/** Ranked donors that were dispatched for this request (what the seeker sees in step 3). */
export async function getRequestMatches(id: string) {
  const dispatches = await db.dispatch.findMany({
    where: { requestId: id },
    include: { donor: true },
    orderBy: { matchScore: 'desc' },
  });
  if (dispatches.length === 0) {
    await getRequest(id); // 404 if the request itself does not exist
  }
  return dispatches.map((d) => ({
    donor: toPublicDonor(toDonor(d.donor)),
    distanceKm: d.distanceKm,
    isCompatible: true,
    matchScore: d.matchScore,
    etaMinutes: d.etaMinutes,
  }));
}

/**
 * Donor accepts (or seeker picks a donor). First one wins: the status flip is an atomic
 * compare-and-set, so two simultaneous accepts can never both succeed.
 */
export async function acceptRequest(requestId: string, donorId: string, channelId?: string) {
  await refreshCooldowns();

  const channel = await db.$transaction(async (tx) => {
    const req = await tx.bloodRequest.findUnique({ where: { id: requestId } });
    if (!req) throw new ApiError(404, 'Request not found', 'NOT_FOUND');
    if (req.status === 'CANCELLED' || req.status === 'FULFILLED') {
      throw new ApiError(409, `Request is already ${req.status.toLowerCase()}`, 'REQUEST_CLOSED');
    }

    const donor = await tx.donor.findUnique({ where: { id: donorId } });
    if (!donor) throw new ApiError(404, 'Donor not found', 'NOT_FOUND');
    if (donor.status === 'OFFLINE' || (donor.cooldownUntil && donor.cooldownUntil > new Date())) {
      throw new ApiError(409, 'Donor is not eligible right now', 'DONOR_UNAVAILABLE');
    }

    const dispatched = await tx.dispatch.findUnique({ where: { requestId_donorId: { requestId, donorId } } });
    if (!dispatched) throw new ApiError(403, 'This donor was not matched to this request', 'NOT_DISPATCHED');

    const claim = await tx.bloodRequest.updateMany({
      where: { id: requestId, status: { in: ['ACTIVE', 'DISPATCHED'] } },
      data: { status: 'MATCHED', acceptedDonorId: donorId },
    });
    if (claim.count === 0) throw new ApiError(409, 'Another donor has already accepted this request', 'ALREADY_MATCHED');

    const proxy = Math.floor(100 + Math.random() * 900);
    const ch = await tx.relayChannel.create({
      data: {
        id: channelId,
        requestId,
        donorId,
        seekerContactMasked: req.contactName || 'Hospital Emergency Desk',
        donorMaskedCode: donor.maskedCode,
        virtualProxyNumber: `+91 800-RELAY-${proxy}`,
        expiresAt: new Date(Date.now() + DAY),
        status: 'ACTIVE',
        hospitalName: req.hospitalName,
        bloodType: req.recipientBloodType,
        unitsRequired: req.unitsRequired,
        messages: {
          create: [
            {
              sender: 'SYSTEM',
              senderMaskedName: 'BloodPulse Privacy Core',
              text: `Virtual Proxy Relay initialized (${donor.maskedCode} <-> ${req.hospitalName}). Direct contact numbers remain encrypted and masked. Valid for 24 hours.`,
            },
            {
              sender: 'SYSTEM',
              senderMaskedName: 'BloodPulse Virtual Bridge',
              text: `Virtual Relay Number: +91 800-RELAY-${proxy}. Calls and SMS routed via proxy.`,
            },
          ],
        },
      },
      include: { messages: true },
    });
    await tx.bloodRequest.update({ where: { id: requestId }, data: { relayChannelId: ch.id } });
    return ch;
  });

  publish(`request:${requestId}`, { type: 'REQUEST_MATCHED', payload: { donorId, channelId: channel.id } });
  return toChannel(channel);
}

export async function cancelRequest(id: string) {
  const req = await db.bloodRequest.findUnique({ where: { id } });
  if (!req) throw new ApiError(404, 'Request not found', 'NOT_FOUND');
  if (req.status === 'FULFILLED' || req.status === 'CANCELLED') {
    throw new ApiError(409, `Request is already ${req.status.toLowerCase()}`, 'REQUEST_CLOSED');
  }
  await db.$transaction([
    db.bloodRequest.update({ where: { id }, data: { status: 'CANCELLED' } }),
    db.relayChannel.updateMany({ where: { requestId: id, status: 'ACTIVE' }, data: { status: 'EXPIRED' } }),
  ]);
  publish(`request:${id}`, { type: 'REQUEST_CANCELLED', payload: { requestId: id } });
  return getRequest(id);
}
