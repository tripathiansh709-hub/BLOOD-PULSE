import type {
  Donor as DbDonor,
  BloodRequest as DbRequest,
  Dispatch as DbDispatch,
  RelayChannel as DbChannel,
  Message as DbMessage,
} from '@prisma/client';
import type { BloodGroup, Donor, DonorStatus, RelayChannel, SeekerRequest, UrgencyLevel, ChatMessage } from '@/types';
import { calculateCooldown } from '@/lib/compatibility';

/** DB row -> the exact `Donor` shape the UI already uses. Phone is never exposed. */
export function toDonor(d: DbDonor): Donor {
  const cd = calculateCooldown(d.lastDonationDate ? d.lastDonationDate.toISOString() : null);
  return {
    id: d.id,
    maskedCode: d.maskedCode,
    name: d.name,
    phoneMasked: d.phoneMasked,
    bloodType: d.bloodType as BloodGroup,
    status: d.status as DonorStatus,
    city: d.city,
    pincode: d.pincode,
    lat: d.lat,
    lng: d.lng,
    responseRate: d.responseRate,
    avgResponseTimeMins: d.avgResponseTimeMins,
    totalDonations: d.totalDonations,
    lastDonationDate: d.lastDonationDate ? d.lastDonationDate.toISOString() : null,
    cooldownUntil: d.cooldownUntil ? d.cooldownUntil.toISOString() : null,
    isEligible: d.status !== 'OFFLINE' && cd.isEligible,
  };
}

/** Public donor listing: coordinates rounded to ~1 km so exact home location is not exposed. */
export function toPublicDonor(d: Donor): Donor {
  return { ...d, lat: Number(d.lat.toFixed(2)), lng: Number(d.lng.toFixed(2)) };
}

export function toRequest(r: DbRequest & { dispatches: Pick<DbDispatch, 'donorId'>[] }): SeekerRequest {
  return {
    id: r.id,
    patientName: r.patientName,
    patientId: r.patientId,
    recipientBloodType: r.recipientBloodType as BloodGroup,
    hospitalName: r.hospitalName,
    hospitalAddress: r.hospitalAddress,
    hospitalLat: r.hospitalLat,
    hospitalLng: r.hospitalLng,
    urgency: r.urgency as UrgencyLevel,
    unitsRequired: r.unitsRequired,
    prescriptionVerified: r.prescriptionVerified,
    prescriptionFileName: r.prescriptionFileName ?? undefined,
    status: r.status as SeekerRequest['status'],
    createdAt: r.createdAt.toISOString(),
    contactName: r.contactName,
    contactMaskedPhone: r.contactMaskedPhone,
    acceptedDonorId: r.acceptedDonorId ?? undefined,
    relayChannelId: r.relayChannelId ?? undefined,
    dispatchedDonorIds: r.dispatches.map((x) => x.donorId),
  };
}

export function toMessage(m: DbMessage): ChatMessage {
  return {
    id: m.id,
    sender: m.sender as ChatMessage['sender'],
    senderMaskedName: m.senderMaskedName,
    text: m.text,
    timestamp: m.timestamp.toISOString(),
  };
}

export function toChannel(c: DbChannel & { messages: DbMessage[] }): RelayChannel {
  return {
    id: c.id,
    requestId: c.requestId,
    seekerContactMasked: c.seekerContactMasked,
    donorId: c.donorId,
    donorMaskedCode: c.donorMaskedCode,
    virtualProxyNumber: c.virtualProxyNumber,
    expiresAt: c.expiresAt.toISOString(),
    status: c.status as RelayChannel['status'],
    messages: [...c.messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()).map(toMessage),
    hospitalName: c.hospitalName,
    bloodType: c.bloodType as BloodGroup,
    unitsRequired: c.unitsRequired,
  };
}
