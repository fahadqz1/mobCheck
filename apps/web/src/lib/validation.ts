import { z } from 'zod';

// User Validation
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(2, 'First name required'),
  lastName: z.string().min(2, 'Last name required'),
  phone: z.string().optional(),
  role: z.enum(['CUSTOMER', 'SHOP_OWNER', 'INSPECTOR']),
});

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

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
