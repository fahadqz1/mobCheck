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
  .regex(/^(\+92|0)3\d{2}[\s-]?\d{7}$/, 'Enter a Pakistani mobile number, e.g. 0300 1234567');

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

// Shop Validation
export const ShopRegistrationSchema = z.object({
  name: z.string().min(3, 'Shop name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Valid phone required'),
  whatsapp: z.string().optional(),
  addressLine1: z.string().min(5, 'Address required'),
  city: z.string().min(2, 'City required'),
  area: z.string().min(2, 'Area required'),
  openingHour: z.string().optional(),
  closingHour: z.string().optional(),
});

// Listing Validation
export const ListingSchema = z.object({
  brandId: z.string().min(1, 'Brand required'),
  modelId: z.string().min(1, 'Model required'),
  storageGb: z.number().optional(),
  ramGb: z.number().optional(),
  color: z.string().optional(),
  condition: z.enum(['BRAND_NEW', 'LIKE_NEW', 'EXCELLENT', 'GOOD', 'FAIR', 'FOR_PARTS']),
  pricePkr: z.number().min(1, 'Price required'),
  ptaStatus: z.enum(['APPROVED', 'NON_PTA', 'UNKNOWN', 'BLOCKED']).default('UNKNOWN'),
  title: z.string().min(5, 'Title required'),
  description: z.string().optional(),
  locationCity: z.string().min(2, 'City required'),
  locationArea: z.string().min(2, 'Area required'),
  sellerContactPreference: z.enum(['WHATSAPP', 'EMAIL', 'PLATFORM', 'PHONE']),
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
export type ShopRegistrationInput = z.infer<typeof ShopRegistrationSchema>;
export type ListingInput = z.infer<typeof ListingSchema>;
export type InspectionBookingInput = z.infer<typeof InspectionBookingSchema>;
export type ReviewInput = z.infer<typeof ReviewSchema>;
