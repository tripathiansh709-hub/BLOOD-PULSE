import { db } from '../db';
import { ApiError } from '../http';
import { publish } from '../events';
import { toChannel, toMessage } from '../mappers';

/** Lazily expire channels past their 24h window. */
async function expireIfNeeded(id: string) {
  await db.relayChannel.updateMany({
    where: { id, status: 'ACTIVE', expiresAt: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  });
}

/** Privacy layer: strip phone numbers / emails typed into chat so identities stay masked. */
export function redactContacts(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email hidden]')
    .replace(/(\+?\d[\d\s().-]{8,}\d)/g, '[number hidden]');
}

export async function getChannel(id: string) {
  await expireIfNeeded(id);
  const ch = await db.relayChannel.findUnique({ where: { id }, include: { messages: true } });
  if (!ch) throw new ApiError(404, 'Relay channel not found', 'NOT_FOUND');
  return toChannel(ch);
}

export async function listChannelsForDonor(donorId: string) {
  await db.relayChannel.updateMany({
    where: { donorId, status: 'ACTIVE', expiresAt: { lte: new Date() } },
    data: { status: 'EXPIRED' },
  });
  const rows = await db.relayChannel.findMany({
    where: { donorId },
    include: { messages: true },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map(toChannel);
}

export async function sendMessage(channelId: string, sender: 'SEEKER' | 'DONOR', text: string, id?: string) {
  await expireIfNeeded(channelId);
  const ch = await db.relayChannel.findUnique({ where: { id: channelId } });
  if (!ch) throw new ApiError(404, 'Relay channel not found', 'NOT_FOUND');
  if (ch.status !== 'ACTIVE') throw new ApiError(409, `Channel is ${ch.status.toLowerCase()}`, 'CHANNEL_CLOSED');

  const msg = await db.message.create({
    data: {
      id,
      channelId,
      sender,
      senderMaskedName: sender === 'DONOR' ? `Donor ${ch.donorMaskedCode}` : ch.seekerContactMasked,
      text: redactContacts(text),
    },
  });
  const dto = toMessage(msg);
  publish(`channel:${channelId}`, { type: 'RELAY_MESSAGE', payload: dto });
  return dto;
}
