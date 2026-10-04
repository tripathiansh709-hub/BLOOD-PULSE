import { BloodGroup, Donor, UrgencyLevel, TransfusionMatchResult } from '@/types';

// Biological Compatibility Matrix for Whole Blood / Packed Red Blood Cells (RBC)
// Source: Strict Medical Transfusion Standards & PRD
export const RBC_COMPATIBILITY: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

// Reverse lookup: Which recipients can this donor give to?
export const RBC_CAN_DONATE_TO: Record<BloodGroup, BloodGroup[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // Universal RBC Donor
  'O+': ['O+', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A+', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'], // Universal Recipient, can only donate RBC to AB+
};

export const BLOOD_GROUP_INFO: Record<
  BloodGroup,
  {
    antigens: string;
    antibodies: string;
    description: string;
    isUniversalDonor?: boolean;
    isUniversalRecipient?: boolean;
    rarityPercent: number;
  }
> = {
  'O-': {
    antigens: 'None',
    antibodies: 'Anti-A, Anti-B',
    description: 'Universal Red Cell Donor. Essential for trauma units and emergencies before crossmatching.',
    isUniversalDonor: true,
    rarityPercent: 7,
  },
  'O+': {
    antigens: 'Rh factor',
    antibodies: 'Anti-A, Anti-B',
    description: 'Most frequently transfused blood type. Crucial for non-Rh negative emergency transfusions.',
    rarityPercent: 37,
  },
  'A-': {
    antigens: 'A antigen',
    antibodies: 'Anti-B',
    description: 'Can donate red cells to A-, A+, AB-, and AB+ recipients.',
    rarityPercent: 6,
  },
  'A+': {
    antigens: 'A antigen, Rh factor',
    antibodies: 'Anti-B',
    description: 'Second most common blood type. Can donate to A+ and AB+ recipients.',
    rarityPercent: 34,
  },
  'B-': {
    antigens: 'B antigen',
    antibodies: 'Anti-A',
    description: 'Rare blood type. Critical for B- and AB- patients in emergency surgery.',
    rarityPercent: 2,
  },
  'B+': {
    antigens: 'B antigen, Rh factor',
    antibodies: 'Anti-A',
    description: 'Can donate red cells to B+ and AB+ recipients.',
    rarityPercent: 10,
  },
  'AB-': {
    antigens: 'A and B antigens',
    antibodies: 'None',
    description: 'Rare blood type. Safe for AB- and AB+ recipients.',
    rarityPercent: 1,
  },
  'AB+': {
    antigens: 'A and B antigens, Rh factor',
    antibodies: 'None',
    description: 'Universal Recipient for RBCs. Can safely receive red blood cells from any blood group.',
    isUniversalRecipient: true,
    rarityPercent: 3,
  },
};

/**
 * Check if donor RBC is biologically compatible with recipient
 */
export function isBloodCompatible(donorType: BloodGroup, recipientType: BloodGroup): boolean {
  const compatibleDonors = RBC_COMPATIBILITY[recipientType] || [];
  return compatibleDonors.includes(donorType);
}

/**
 * Spatial calculation: Haversine distance in Kilometers
 * Simulates PostGIS ST_Distance(ST_MakePoint, ST_MakePoint)
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

/**
 * Match ranking algorithm mimicking PostGIS + scoring heuristics
 */
export function calculateMatchScore(donor: Donor, distanceKm: number, urgency: UrgencyLevel): number {
  // Proximity score: max 50 pts (closer is higher)
  const proximityScore = Math.max(0, 50 - distanceKm * 1.5);

  // Response rate: max 35 pts
  const responseScore = (donor.responseRate / 100) * 35;

  // Donation history bonus: max 15 pts
  const historyScore = Math.min(15, donor.totalDonations * 1.5);

  let totalScore = proximityScore + responseScore + historyScore;

  // High urgency boosts fast-response donors
  if (urgency === 'IMMEDIATE') {
    if (donor.avgResponseTimeMins <= 5) totalScore += 10;
    if (distanceKm <= 5) totalScore += 10;
  }

  return Math.min(100, Math.round(totalScore));
}

/**
 * 90-Day Auto-Cooldown Engine (12 Weeks post-donation regulation)
 */
export const COOLDOWN_DAYS = 90;

export function calculateCooldown(lastDonationDate: string | null): {
  isEligible: boolean;
  daysRemaining: number;
  cooldownDate: string | null;
  progressPercent: number;
} {
  if (!lastDonationDate) {
    return { isEligible: true, daysRemaining: 0, cooldownDate: null, progressPercent: 100 };
  }

  const lastDonation = new Date(lastDonationDate);
  const cooldownEnd = new Date(lastDonation.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  const diffMs = cooldownEnd.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const daysPassed = COOLDOWN_DAYS - daysRemaining;
  const progressPercent = Math.min(100, Math.max(0, Math.round((daysPassed / COOLDOWN_DAYS) * 100)));

  return {
    isEligible: daysRemaining <= 0,
    daysRemaining,
    cooldownDate: cooldownEnd.toISOString(),
    progressPercent,
  };
}

/**
 * Rank and filter donors for a specific emergency request
 */
export function findMatchingDonors(
  recipientBloodType: BloodGroup,
  hospitalLat: number,
  hospitalLng: number,
  urgency: UrgencyLevel,
  donors: Donor[],
  maxRadiusKm: number = 50
): TransfusionMatchResult[] {
  const results: TransfusionMatchResult[] = [];

  for (const donor of donors) {
    const isCompatible = isBloodCompatible(donor.bloodType, recipientBloodType);
    if (!isCompatible) continue;

    // Donor must be Available or Standby, and eligible under the 90-day cooldown rule
    const cooldownInfo = calculateCooldown(donor.lastDonationDate);
    if (!cooldownInfo.isEligible || donor.status === 'OFFLINE') continue;

    const distanceKm = calculateDistanceKm(hospitalLat, hospitalLng, donor.lat, donor.lng);
    if (distanceKm > maxRadiusKm) continue;

    const matchScore = calculateMatchScore(donor, distanceKm, urgency);
    // Estimated ETA in minutes (traffic estimate ~ 3 mins per km + 5 min prep)
    const etaMinutes = Math.round(5 + distanceKm * 3.2);

    results.push({
      donor,
      distanceKm,
      isCompatible,
      matchScore,
      etaMinutes,
    });
  }

  // Sort by match score descending (highest score first)
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
