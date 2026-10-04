import { db } from '../db';
import { refreshCooldowns } from './donors';

export async function getStats() {
  await refreshCooldowns();
  const [byStatus, byType, requestsByStatus, donations] = await Promise.all([
    db.donor.groupBy({ by: ['status'], _count: { _all: true } }),
    db.donor.groupBy({ by: ['bloodType'], _count: { _all: true } }),
    db.bloodRequest.groupBy({ by: ['status'], _count: { _all: true } }),
    db.donor.aggregate({ _sum: { totalDonations: true }, _count: { _all: true } }),
  ]);
  return {
    totalDonors: donations._count._all,
    totalDonations: donations._sum.totalDonations ?? 0,
    donorsByStatus: Object.fromEntries(byStatus.map((r) => [r.status, r._count._all])),
    donorsByBloodType: Object.fromEntries(byType.map((r) => [r.bloodType, r._count._all])),
    requestsByStatus: Object.fromEntries(requestsByStatus.map((r) => [r.status, r._count._all])),
  };
}
