/**
 * Seeds the database with the same demo data the UI ships with (src/lib/mockData.ts),
 * so the frontend and the API tell the same story from day one.
 * WARNING: wipes existing rows. Run with:  npm run db:seed
 */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { INITIAL_DONORS, INITIAL_HOSPITALS, INITIAL_REQUESTS, INITIAL_RELAY_CHANNELS } from '../src/lib/mockData';
import { calculateDistanceKm, calculateMatchScore } from '../src/lib/compatibility';
import { encrypt } from '../src/server/crypto';

// Minimal .env loader (works regardless of Node version / how the script is launched)
(function loadEnv() {
  const p = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})();

const prisma = new PrismaClient();

async function main() {
  await prisma.message.deleteMany();
  await prisma.relayChannel.deleteMany();
  await prisma.dispatch.deleteMany();
  await prisma.bloodRequest.deleteMany();
  await prisma.donor.deleteMany();
  await prisma.hospital.deleteMany();

  for (const h of INITIAL_HOSPITALS) {
    await prisma.hospital.create({
      data: {
        id: h.id,
        name: h.name,
        address: h.address,
        lat: h.lat,
        lng: h.lng,
        emergencyPhoneMasked: h.emergencyPhoneMasked,
      },
    });
  }

  for (let i = 0; i < INITIAL_DONORS.length; i++) {
    const d = INITIAL_DONORS[i];
    await prisma.donor.create({
      data: {
        id: d.id,
        maskedCode: d.maskedCode,
        name: d.name,
        phoneEnc: encrypt(`+91980000${String(i + 1).padStart(4, '0')}`), // demo numbers
        phoneMasked: d.phoneMasked,
        bloodType: d.bloodType,
        status: d.status,
        city: d.city,
        pincode: d.pincode,
        lat: d.lat,
        lng: d.lng,
        responseRate: d.responseRate,
        avgResponseTimeMins: d.avgResponseTimeMins,
        totalDonations: d.totalDonations,
        lastDonationDate: d.lastDonationDate ? new Date(d.lastDonationDate) : null,
        cooldownUntil: d.cooldownUntil ? new Date(d.cooldownUntil) : null,
      },
    });
  }

  for (const r of INITIAL_REQUESTS) {
    const channel = INITIAL_RELAY_CHANNELS.find((c) => c.requestId === r.id);
    await prisma.bloodRequest.create({
      data: {
        id: r.id,
        patientName: r.patientName,
        patientId: r.patientId,
        recipientBloodType: r.recipientBloodType,
        hospitalName: r.hospitalName,
        hospitalAddress: r.hospitalAddress,
        hospitalLat: r.hospitalLat,
        hospitalLng: r.hospitalLng,
        urgency: r.urgency,
        unitsRequired: r.unitsRequired,
        prescriptionVerified: r.prescriptionVerified,
        prescriptionFileName: r.prescriptionFileName,
        // a request that already has a relay channel is MATCHED in the backend's state machine
        status: channel ? 'MATCHED' : r.status,
        contactName: r.contactName,
        contactMaskedPhone: r.contactMaskedPhone,
        acceptedDonorId: channel?.donorId,
        relayChannelId: channel?.id,
        createdAt: new Date(r.createdAt),
      },
    });

    for (const donorId of r.dispatchedDonorIds) {
      const donor = INITIAL_DONORS.find((x) => x.id === donorId);
      if (!donor) continue;
      const distanceKm = calculateDistanceKm(r.hospitalLat, r.hospitalLng, donor.lat, donor.lng);
      await prisma.dispatch.create({
        data: {
          requestId: r.id,
          donorId,
          distanceKm,
          matchScore: calculateMatchScore(donor, distanceKm, r.urgency),
          etaMinutes: Math.round(5 + distanceKm * 3.2),
        },
      });
    }
  }

  for (const c of INITIAL_RELAY_CHANNELS) {
    await prisma.relayChannel.create({
      data: {
        id: c.id,
        requestId: c.requestId,
        donorId: c.donorId,
        seekerContactMasked: c.seekerContactMasked,
        donorMaskedCode: c.donorMaskedCode,
        virtualProxyNumber: c.virtualProxyNumber,
        expiresAt: new Date(c.expiresAt),
        status: c.status,
        hospitalName: c.hospitalName,
        bloodType: c.bloodType,
        unitsRequired: c.unitsRequired,
        messages: {
          create: c.messages.map((m) => ({
            id: m.id,
            sender: m.sender,
            senderMaskedName: m.senderMaskedName,
            text: m.text,
            timestamp: new Date(m.timestamp),
          })),
        },
      },
    });
  }

  console.log(
    `Seeded ${INITIAL_HOSPITALS.length} hospitals, ${INITIAL_DONORS.length} donors, ` +
      `${INITIAL_REQUESTS.length} requests, ${INITIAL_RELAY_CHANNELS.length} relay channel(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
