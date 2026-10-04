import { z } from 'zod';

export const BloodGroupSchema = z.enum(['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']);
export const UrgencySchema = z.enum(['IMMEDIATE', 'WITHIN_12_HOURS']);
export const DonorStatusSchema = z.enum(['AVAILABLE', 'STANDBY', 'RECENTLY_DONATED', 'OFFLINE']);

const phone = z.string().regex(/^\+?[0-9\s-]{10,15}$/, 'Enter a valid phone number');

export const RegisterDonorSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  bloodType: BloodGroupSchema,
  city: z.string().trim().min(2).max(60),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  lastDonationDate: z.string().datetime().nullable().optional(),
});

export const UpdateDonorSchema = z
  .object({
    city: z.string().trim().min(2).max(60),
    pincode: z.string().regex(/^\d{6}$/),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    phone,
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

export const SetStatusSchema = z.object({ status: DonorStatusSchema });

export const ListDonorsQuery = z.object({
  bloodType: BloodGroupSchema.optional(),
  status: DonorStatusSchema.optional(),
  city: z.string().optional(),
  // radar filter: donors within radiusKm of (lat, lng)
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().min(1).max(200).default(25),
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

// Mirrors exactly what SeekerWizard sends today, plus an optional hospitalId shortcut.
export const CreateRequestSchema = z.object({
  patientName: z.string().trim().min(2).max(80),
  patientId: z.string().trim().min(2).max(40),
  recipientBloodType: BloodGroupSchema,
  hospitalId: z.string().optional(),
  hospitalName: z.string().trim().min(2).max(160).optional(),
  hospitalAddress: z.string().trim().min(2).max(240).optional(),
  hospitalLat: z.number().min(-90).max(90).optional(),
  hospitalLng: z.number().min(-180).max(180).optional(),
  urgency: UrgencySchema,
  unitsRequired: z.number().int().min(1).max(10),
  prescriptionVerified: z.boolean().default(false),
  prescriptionFileName: z.string().max(200).optional(),
  contactName: z.string().trim().max(120).default('Hospital Emergency Desk'),
  contactMaskedPhone: z.string().max(40).optional(),
});

export const AcceptRequestSchema = z.object({
  donorId: z.string().min(1),
  actor: z.enum(['DONOR', 'SEEKER']).default('DONOR'),
});

export const SendMessageSchema = z.object({
  sender: z.enum(['SEEKER', 'DONOR']),
  text: z.string().trim().min(1).max(1000),
});

export const ListRequestsQuery = z.object({
  status: z.enum(['ACTIVE', 'DISPATCHED', 'MATCHED', 'FULFILLED', 'CANCELLED']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const MatchQuery = z.object({
  recipientBloodType: BloodGroupSchema,
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  urgency: UrgencySchema.default('IMMEDIATE'),
  radiusKm: z.coerce.number().min(1).max(200).default(50),
});

export const ScreeningSchema = z.object({
  age: z.number().int().min(0).max(120),
  weightKg: z.number().min(10).max(300),
  hemoglobin: z.number().min(3).max(25).optional(), // g/dL
  lastDonationDate: z.string().datetime().nullable().optional(),
  feelingWell: z.boolean(),
  recentTattooSurgeryOrTransfusion: z.boolean().default(false), // past 6 months
});
