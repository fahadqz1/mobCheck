import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address');
export const passwordRule = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/[0-9]/, 'Password must contain a number');
export const pkPhone = z
  .string()
  .trim()
  .regex(/^(\+92|0)[\s-]?3\d{2}[\s-]?\d{7}$/,'Enter a Pakistani mobile number, e.g. 0300 1234567');

// Inspector accounts are created by shop owners, never self-registered.
export const RegisterSchema = z.object({
  email,
  password: passwordRule,
  firstName: z.string().trim().min(2, 'First name is required').max(50),
  lastName: z.string().trim().min(2, 'Last name is required').max(50),
  phone: pkPhone.optional().or(z.literal('').transform(() => undefined)),
  role: z.enum(['CUSTOMER', 'SHOP_OWNER']).default('CUSTOMER'),
});

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const ProfileSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required').max(50),
  lastName: z.string().trim().min(2, 'Last name is required').max(50),
  phone: pkPhone.optional().or(z.literal('').transform(() => null)),
  city: z.string().trim().max(50).optional(),
  area: z.string().trim().max(80).optional(),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordRule,
});

export const ForgotPasswordSchema = z.object({ email });
export const ResetPasswordSchema = z.object({ token: z.string().min(20), password: passwordRule });

const intInRange = (min: number, max: number, label: string, required: boolean) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v, ctx): number | undefined => {
      if (v === undefined || v === '') {
        if (required) ctx.addIssue({ code: 'custom', message: `Enter ${label.toLowerCase()}` });
        return undefined;
      }
      const n = Number(v);
      if (!Number.isInteger(n)) ctx.addIssue({ code: 'custom', message: `${label} must be a whole number` });
      else if (n < min) ctx.addIssue({ code: 'custom', message: `${label} must be at least ${min.toLocaleString()}` });
      else if (n > max) ctx.addIssue({ code: 'custom', message: `${label} must be at most ${max.toLocaleString()}` });
      return n;
    });
const optionalInt = (min: number, max: number, label: string) => intInRange(min, max, label, false);

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM, e.g. 10:00');
const optionalCoord = (min: number, max: number) =>
  z
    .union([z.number(), z.string()])
    .optional()
    .transform((v, ctx): number | null => {
      if (v === undefined || v === '') return null;
      const n = Number(v);
      if (Number.isNaN(n) || n < min || n > max) ctx.addIssue({ code: 'custom', message: 'Enter a valid coordinate' });
      return n;
    });

export const ShopSchema = z.object({
  name: z.string().trim().min(3, 'Shop name must be at least 3 characters').max(80),
  description: z.string().trim().max(1500).optional(),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: pkPhone,
  whatsapp: pkPhone.optional().or(z.literal('').transform(() => undefined)),
  addressLine1: z.string().trim().min(5, 'Enter the shop address').max(150),
  addressLine2: z.string().trim().max(150).optional(),
  city: z.string().trim().min(2, 'Choose a city'),
  area: z.string().trim().min(2, 'Enter the market or area').max(80),
  openingHour: hhmm,
  closingHour: hhmm,
  weeklyHolidays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).default([]),
  latitude: optionalCoord(-90, 90),
  longitude: optionalCoord(-180, 180),
});

export const ServiceSchema = z.object({
  name: z.string().trim().min(3, 'Service name is required').max(80),
  description: z.string().trim().max(300).optional(),
  pricePkr: intInRange(0, 500_000, 'Price', true).transform((v) => v as number),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const availability = {
  availableMonday: z.boolean().default(true),
  availableTuesday: z.boolean().default(true),
  availableWednesday: z.boolean().default(true),
  availableThursday: z.boolean().default(true),
  availableFriday: z.boolean().default(true),
  availableSaturday: z.boolean().default(true),
  availableSunday: z.boolean().default(false),
  startTime: hhmm.optional(),
  endTime: hhmm.optional(),
};

export const InspectorCreateSchema = z.object({
  firstName: z.string().trim().min(2, 'First name is required').max(50),
  lastName: z.string().trim().min(2, 'Last name is required').max(50),
  email,
  phone: pkPhone.optional().or(z.literal('').transform(() => undefined)),
  ...availability,
});

export const InspectorUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
  ...availability,
});

export const ComplaintSchema = z.object({
  shopId: z.string().min(1),
  bookingId: z.string().optional(),
  category: z.enum(['FRAUDULENT', 'MISLEADING_INFO', 'POOR_QUALITY', 'INCORRECT_REPORT', 'PAYMENT_ISSUE', 'FAKE_REVIEWS', 'HARASSMENT', 'CANCELLATION', 'OTHER'], { errorMap: () => ({ message: 'Choose a category' }) }),
  description: z.string().trim().min(20, 'Describe what happened in at least 20 characters').max(2000),
});


export const ListingSchema = z.object({
  brandId: z.string().min(1, 'Choose a brand'),
  modelId: z.string().min(1, 'Choose a model'),
  storageGb: optionalInt(8, 2048, 'Storage'),
  ramGb: optionalInt(1, 32, 'RAM'),
  color: z.string().trim().max(40).optional(),
  condition: z.enum(['BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS'], { errorMap: () => ({ message: 'Choose a condition' }) }),
  pricePkr: intInRange(1000, 2_000_000, 'Price', true).transform((v) => v as number),
  ptaStatus: z.enum(['APPROVED', 'NON_PTA', 'UNKNOWN']).default('UNKNOWN'),
  batteryHealth: optionalInt(1, 100, 'Battery health'),
  repairHistory: z.string().trim().max(500).optional(),
  hasBox: z.boolean().default(false),
  hasCharger: z.boolean().default(false),
  hasAccessories: z.array(z.string().trim().min(1).max(40)).max(10).default([]),
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(90, 'Keep the title under 90 characters'),
  description: z.string().trim().max(2000, 'Keep the description under 2000 characters').optional(),
  locationCity: z.string().trim().min(2, 'Choose a city'),
  locationArea: z.string().trim().min(2, 'Enter your area').max(80),
  sellerContactPreference: z.enum(['WHATSAPP', 'PLATFORM', 'PHONE']).default('PLATFORM'),
});

export const ListingStatusSchema = z.object({ status: z.enum(['ACTIVE', 'SOLD', 'REMOVED']) });

export const InquirySchema = z.object({
  message: z.string().trim().min(10, 'Write at least 10 characters').max(1000),
});

export const ListingReportSchema = z.object({
  reason: z.enum(['SUSPECTED_SCAM', 'STOLEN_DEVICE', 'MISLEADING_DETAILS', 'WRONG_PRICE', 'ALREADY_SOLD', 'OFFENSIVE', 'OTHER'], { errorMap: () => ({ message: 'Choose a reason' }) }),
  details: z.string().trim().max(1000).optional(),
});

// Inspection Booking Validation
export const InspectionBookingSchema = z.object({
  brandId: z.string().min(1, 'Brand required'),
  modelId: z.string().min(1, 'Model required'),
  deviceType: z.enum(['IPHONE', 'ANDROID']),
  shopId: z.string().min(1, 'Shop required'),
  inspectionDate: z.string().datetime('Invalid date'),
  locationLatitude: z.number().optional(),
  locationLongitude: z.number().optional(),
});

// Review Validation
export const ReviewSchema = z.object({
  overallRating: z.number().min(1).max(5),
  inspectionQuality: z.number().min(1).max(5).optional(),
  professionalism: z.number().min(1).max(5).optional(),
  timeliness: z.number().min(1).max(5).optional(),
  communication: z.number().min(1).max(5).optional(),
  reportAccuracy: z.number().min(1).max(5).optional(),
  reviewText: z.string().max(1000).optional(),
  wouldRecommend: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ListingInput = z.infer<typeof ListingSchema>;
export type InspectionBookingInput = z.infer<typeof InspectionBookingSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
