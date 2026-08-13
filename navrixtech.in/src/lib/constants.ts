export const SITE_NAME = "Navrix";
export const SITE_URL = "https://navrixtech.in";
export const SITE_DESCRIPTION =
  "Premium gaming peripherals, mechanical keyboards, mice, desk accessories, and consumer electronics.";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Products", href: "/products" },
  { label: "Keyboard", href: "/products?category=mechanical-keyboards" },
  { label: "Mice", href: "/products?category=gaming-mice" },
  { label: "Contact", href: "/contact" },
] as const;

export const FOOTER_LINKS = {
  shop: [
    { label: "All Products", href: "/products" },
    { label: "New Arrivals", href: "/products?sort=newest" },
    { label: "Best Sellers", href: "/products?sort=best-selling" },
    { label: "Deals", href: "/products?sort=discount" },
  ],
  support: [
    { label: "Contact Us", href: "/contact" },
    { label: "FAQ", href: "/contact#faq" },
    { label: "Shipping Policy", href: "/shipping" },
    { label: "Return Policy", href: "/returns" },
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
  ],
  account: [
    { label: "My Account", href: "/dashboard" },
    { label: "Orders", href: "/dashboard/orders" },
    { label: "Wishlist", href: "/dashboard/wishlist" },
  ],
} as const;

export const PRODUCT_SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "best-selling", label: "Best Selling" },
  { value: "discount", label: "Biggest Discount" },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PROCESSING: "Processing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
  FAILED: "Failed",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  FAILED: "Failed",
  REFUNDED: "Refunded",
};

export const FREE_SHIPPING_THRESHOLD = 99900; // ₹999 in paise
export const FLAT_SHIPPING_RATE = 4900; // ₹49 in paise
