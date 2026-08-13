import { z } from "zod";

// Auth
export const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile
export const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Address
export const addressSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(10),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6).max(6),
  country: z.string().default("India"),
  isDefault: z.boolean().default(false),
});

// Product (Admin)
export const productSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().min(10),
  sku: z.string().optional(),
  brandId: z.string().optional(),
  categoryId: z.string().min(1),
  price: z.number().int().positive(),
  compareAtPrice: z.number().int().positive().optional(),
  costPrice: z.number().int().optional(),
  warranty: z.string().optional(),
  weight: z.number().positive().optional(),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  isBestSeller: z.boolean().default(false),
  isNewArrival: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const brandSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  logo: z.string().optional(),
  banner: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const bannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  image: z.string().min(1),
  ctaLabel: z.string().optional(),
  ctaLink: z.string().optional(),
  position: z.string().default("home_hero"),
  order: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const couponSchema = z.object({
  code: z.string().min(3).transform((v) => v.toUpperCase()),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().positive(),
  minOrder: z.number().int().default(0),
  maxDiscount: z.number().int().positive().optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

// Contact
export const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

// Newsletter
export const newsletterSchema = z.object({
  email: z.string().email(),
});

// Review
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().optional(),
  body: z.string().optional(),
});

// Search
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.coerce.number().int().optional(),
  maxPrice: z.coerce.number().int().optional(),
  sort: z.enum(["newest", "price-low", "price-high", "rating", "best-selling", "discount"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  view: z.enum(["grid", "list"]).default("grid"),
});

// Coupon apply
export const applyCouponSchema = z.object({
  code: z.string().min(1),
  subtotal: z.number().int().positive(),
});

// Settings
export const settingsSchema = z.record(z.string(), z.unknown());
