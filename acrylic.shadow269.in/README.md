# Shop Shadow269

**Premium acrylic 3-in-1 keyboard accessory e-commerce site.**
Live at: `shop.shadow269.in`

> One Acrylic Accessory. Three Essential Functions.

## What this is

A production-ready, fully responsive e-commerce site for a single hero product — the **Acrylic 3-in-1 Keyboard Armrest Cover** for 65% mechanical keyboards. Functions as a dust cover, arm rest, and keyboard height stand.

Built with vanilla HTML/CSS/JS — no framework, no build step. Open `index.html` and it runs.

## Project structure

```
shop-shadow269/
│
├── index.html                          Landing page
├── products/
│   └── acrylic-3-in-1-cover.html       Product detail page
│
├── css/
│   ├── style.css                       Core design system + landing page
│   ├── product.css                     Product page styles
│   ├── checkout.css                    Cart + success page styles
│   └── responsive.css                  Breakpoints (1440 / 1024 / 768 / 480)
│
├── js/
│   ├── main.js                         Nav, scroll reveal, FAQ accordion, feature tabs
│   ├── cart.js                         Cart state (localStorage), drawer UI
│   ├── product.js                      Gallery, quantity selector, image zoom
│   └── razorpay.js                     Razorpay Checkout integration
│
├── checkout/
│   ├── cart.html                       Cart review + shipping form + pay
│   └── success.html                    Order confirmation
│
├── assets/
│   ├── images/                         Product photography (add your own)
│   ├── icons/
│   └── logo/
│
└── README.md
```

## Setting up Razorpay

1. Create a Razorpay account and get your **Key ID** (test or live) from the dashboard.
2. Open `js/razorpay.js` and replace:
   ```js
   key: "YOUR_RAZORPAY_KEY",
   ```
   with your actual key.
3. The Razorpay checkout script is already loaded on `checkout/cart.html` via:
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
   ```
4. **Important:** the current flow creates a client-side order amount only. For production, you should generate the Razorpay `order_id` server-side (Node/PHP/etc.) before opening checkout, to prevent tampering with the amount. This template uses the client-only flow for simplicity — swap in a real backend order-creation call when you're ready to go live with real payments.

## Cart behavior

- Cart state lives in `localStorage` under the key `shadow269_cart`.
- `window.addToCart(name, price, qty)` is the global helper used across pages — call it from any page that includes `cart.js`.
- The cart drawer (slide-out panel) is present on the homepage and product page. The dedicated `/checkout/cart.html` page is for full review + checkout.
- On successful payment, the order is stored under `shadow269_last_order` and the cart is cleared, then the user is redirected to `/checkout/success.html`.

## Product images

The site currently uses CSS-drawn placeholder graphics (acrylic card mockups) everywhere a product photo would go — in the hero, feature panels, product gallery, and thumbnails. To finish the site:

1. Drop real product photography into `assets/images/`.
2. In `products/acrylic-3-in-1-cover.html`, replace the `.main-image-placeholder` div with an `<img id="mainImg" src="../assets/images/product-1.jpg" alt="...">`.
3. Replace each `.thumb-wrap` placeholder with thumbnail `<img>` tags and a `data-src` pointing to the matching full-size image — `product.js` already wires up thumbnail-click-to-swap and hover-zoom.
4. Add an Open Graph image at `assets/images/og-image.jpg` (referenced in both pages' meta tags).

## SEO

- Both `index.html` and the product page have unique title/description tags, Open Graph tags, and Product schema (JSON-LD).
- Checkout pages are marked `noindex` since they shouldn't be crawled.
- Add a `sitemap.xml` and `robots.txt` at the root before going live — not included here since the final domain structure may change.

## Browser support

Modern evergreen browsers (Chrome, Safari, Firefox, Edge). Uses CSS custom properties, `backdrop-filter`, and `clamp()` — no IE11 support.

## Customization quick-reference

| What | Where |
|---|---|
| Brand colors | CSS variables in `css/style.css` `:root` |
| Price | `products/acrylic-3-in-1-cover.html` `.price-current`, plus `product.js` `addToCart` call (currently hardcoded `1499`) |
| Copy / sections | Directly in `index.html` |
| FAQ content | `index.html` `.faq-list` |
| Compatible keyboards list | `index.html` `.compat-tags` and product page specs tab |

## Notes

- Razorpay key, product price, and shipping costs are currently hardcoded for a single-SKU store. If you add more sizes (60%, 75%, TKL, Full — see the "Coming Soon" section), you'll want to move product data into a shared config (similar to how KeebForge.in centralizes pricing in `prices.js`) rather than hardcoding per-page.
- No backend included. Order confirmation currently only persists to `localStorage` — for real order tracking/fulfillment, you'll need a backend (or a service like Google Sheets via Apps Script, Firebase, or a simple Node/Express API) to receive the Razorpay webhook and store orders durably.