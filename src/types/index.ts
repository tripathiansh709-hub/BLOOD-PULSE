export type BloodGroup = 'O-' | 'O+' | 'A-' | 'A+' | 'B-' | 'B+' | 'AB-' | 'AB+';

export type UrgencyLevel = 'IMMEDIATE' | 'WITHIN_12_HOURS';

export type DonorStatus = 'AVAILABLE' | 'STANDBY' | 'RECENTLY_DONATED' | 'OFFLINE';

export interface Donor {
  id: string;
  maskedCode: string; // e.g., "DN-8492" (never exposes direct phone)
  name: string;
  phoneMasked: string; // e.g., "+91 98••• ••210"
  bloodType: BloodGroup;
  status: DonorStatus;
  city: string;
  pincode: string;
  lat: number;
  lng: number;
  responseRate: number; // percentage (e.g. 98)
  avgResponseTimeMins: number; // e.g. 4 mins
  totalDonations: number;
  lastDonationDate: string | null; // ISO string
  cooldownUntil: string | null; // ISO string (90 days cooldown)
  isEligible: boolean;
}

export interface SeekerRequest {
  id: string;
  patientName: string;
  patientId: string;
  recipientBloodType: BloodGroup;
  hospitalName: string;
  hospitalAddress: string;
  hospitalLat: number;
  hospitalLng: number;
  urgency: UrgencyLevel;
  unitsRequired: number;
  prescriptionVerified: boolean;
  prescriptionFileName?: string;
  status: 'ACTIVE' | 'DISPATCHED' | 'MATCHED' | 'FULFILLED' | 'CANCELLED';
  createdAt: string;
  contactName: string;
  contactMaskedPhone: string;
  acceptedDonorId?: string;
  relayChannelId?: string;
  dispatchedDonorIds: string[];
}

export interface ChatMessage {
  id: string;
  sender: 'SEEKER' | 'DONOR' | 'SYSTEM';
  senderMaskedName: string;
  text: string;
  timestamp: string;
}

export interface RelayChannel {
  id: string;
  requestId: string;
  seekerContactMasked: string;
  donorId: string;
  donorMaskedCode: string;
  virtualProxyNumber: string; // e.g. "+91 800-RELAY-108"
  expiresAt: string; // 24 hours expiry
  status: 'ACTIVE' | 'EXPIRED' | 'FULFILLED';
  messages: ChatMessage[];
  hospitalName: string;
  bloodType: BloodGroup;
  unitsRequired: number;
}

export interface EmergencyNotification {
  id: string;
  requestId: string;
  hospitalName: string;
  hospitalAddress: string;
  bloodType: BloodGroup;
  unitsRequired: number;
  urgency: UrgencyLevel;
  distanceKm: number;
  createdAt: string;
}

export interface TransfusionMatchResult {
  donor: Donor;
  distanceKm: number;
  isCompatible: boolean;
  matchScore: number;
  etaMinutes: number;
}
