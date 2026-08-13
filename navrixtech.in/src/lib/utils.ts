import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function formatPriceCompact(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100000) return `${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000) return `${(rupees / 1000).toFixed(1)}K`;
  return formatPrice(paise);
}

export function discountPercent(price: number, compareAt: number): number {
  if (!compareAt || compareAt <= price) return 0;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateOrderNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `NRX-${ts}-${rand}`;
}

export function truncate(text: string, max: number): string {
  return text.length > max ? text.slice(0, max) + "…" : text;
}

export function getImageUrl(publicId: string, w?: number): string {
  const base = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`;
  const transforms = w ? `c_scale,w_${w}/` : "";
  return `${base}/${transforms}${publicId}`;
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function getPaginationParams(searchParams: Record<string, string | undefined>) {
  const page = Math.max(1, parseInt(searchParams.page || "1", 10));
  const pageSize = Math.min(48, Math.max(1, parseInt(searchParams.pageSize || "12", 10)));
  const skip = (page - 1) * pageSize;
  return { page, pageSize, skip };
}
