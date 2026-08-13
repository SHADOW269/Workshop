import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type ProductSeed = {
  name: string;
  slug: string;
  description: string;
  categoryId: string;
  brandId?: string;
  price: number;
  compareAtPrice?: number;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  rating?: number;
  ratingCount?: number;
  soldCount?: number;
  images: { url: string; alt: string; position: number }[];
  variants?: { name: string; value: string; price?: number }[];
  stock?: number;
};

async function main() {
  console.log("Seeding database...");

  // Admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@navrixtech.in" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@navrixtech.in",
      password: adminPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });
  console.log(`✓ Admin: ${admin.email}`);

  // Categories
  const categoryData = [
    { name: "Mechanical Keyboards", slug: "mechanical-keyboards", icon: "keyboard" },
    { name: "Gaming Mice", slug: "gaming-mice", icon: "mouse" },
    { name: "Mouse Pads", slug: "mouse-pads", icon: "pad" },
    { name: "Desk Accessories", slug: "desk-accessories", icon: "desk" },
    { name: "Audio", slug: "audio", icon: "headphones" },
    { name: "Gaming Accessories", slug: "gaming-accessories", icon: "gamepad" },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    categories[cat.slug] = created.id;
  }
  console.log(`✓ ${categoryData.length} categories`);

  // Brands
  const brandData = [
    { name: "Logitech", slug: "logitech", description: "Swiss precision peripherals" },
    { name: "Razer", slug: "razer", description: "For gamers, by gamers" },
    { name: "Corsair", slug: "corsair", description: "Premium PC peripherals" },
    { name: "HyperX", slug: "hyperx", description: "Built for performance" },
    { name: "SteelSeries", slug: "steelseries", description: "Gear up, game on" },
    { name: "Keychron", slug: "keychron", description: "Wireless mechanical keyboards" },
    { name: "Ducky", slug: "ducky", description: "Taiwanese mechanical keyboards" },
  ];

  const brands: Record<string, string> = {};
  for (const brand of brandData) {
    const created = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: {
        name: brand.name,
        slug: brand.slug,
        description: brand.description,
      },
    });
    brands[brand.slug] = created.id;
  }
  console.log(`✓ ${brandData.length} brands`);

  // Products
  const productData: ProductSeed[] = [
    {
      name: "Keychron Q1 Pro",
      slug: "keychron-q1-pro",
      description:
        "Wireless mechanical keyboard with QMK/VIA support, hot-swappable Gateron Jupiter switches, aluminum frame, and 1000Hz polling rate. Premium build quality meets wireless freedom.",
      categoryId: categories["mechanical-keyboards"],
      brandId: brands["keychron"],
      price: 1799900,
      compareAtPrice: 1999900,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.8,
      ratingCount: 234,
      soldCount: 1200,
      images: [
        { url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800", alt: "Keychron Q1 Pro keyboard", position: 0 },
      ],
      variants: [
        { name: "Color", value: "Carbon Black", price: 1799900 },
        { name: "Color", value: "Silver White", price: 1799900 },
      ],
      stock: 45,
    },
    {
      name: "Razer Viper V3 Pro",
      slug: "razer-viper-v3-pro",
      description:
        "Ultra-lightweight 54g wireless gaming mouse with Focus Pro 35K optical sensor, Gen-3 optical switches, and up to 95 hours of battery life. Built for competitive esports.",
      categoryId: categories["gaming-mice"],
      brandId: brands["razer"],
      price: 1499900,
      compareAtPrice: 1699900,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.7,
      ratingCount: 189,
      soldCount: 980,
      images: [
        { url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800", alt: "Razer Viper V3 Pro mouse", position: 0 },
      ],
      variants: [
        { name: "Color", value: "Black", price: 1499900 },
        { name: "Color", value: "White", price: 1499900 },
      ],
      stock: 32,
    },
    {
      name: "Corsair K100 RGB",
      slug: "corsair-k100-rgb",
      description:
        "Premium mechanical gaming keyboard with Cherry MX Speed switches, iCUE control wheel, per-key RGB lighting, and aircraft-grade aluminum frame.",
      categoryId: categories["mechanical-keyboards"],
      brandId: brands["corsair"],
      price: 1999900,
      compareAtPrice: 2299900,
      isFeatured: true,
      isNewArrival: true,
      rating: 4.6,
      ratingCount: 156,
      soldCount: 670,
      images: [
        { url: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800", alt: "Corsair K100 RGB keyboard", position: 0 },
      ],
      stock: 28,
    },
    {
      name: "SteelSeries Prime Wireless",
      slug: "steelseries-prime-wireless",
      description:
        "Esports-grade wireless gaming mouse with Prestige OM optical magnetic switches, TrueMove Air sensor, and 100+ hour battery life.",
      categoryId: categories["gaming-mice"],
      brandId: brands["steelseries"],
      price: 999900,
      compareAtPrice: 1199900,
      isBestSeller: true,
      rating: 4.5,
      ratingCount: 127,
      soldCount: 540,
      images: [
        { url: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=800", alt: "SteelSeries Prime Wireless mouse", position: 0 },
      ],
      stock: 50,
    },
    {
      name: "HyperX Cloud III Wireless",
      slug: "hyperx-cloud-iii-wireless",
      description:
        "Wireless gaming headset with 30mm drivers, DTS Headphone:X spatial audio, ultra-comfortable memory foam, and up to 120 hours of battery life.",
      categoryId: categories["audio"],
      brandId: brands["hyperx"],
      price: 1299900,
      compareAtPrice: 1499900,
      isFeatured: true,
      isNewArrival: true,
      rating: 4.7,
      ratingCount: 203,
      soldCount: 890,
      images: [
        { url: "https://images.unsplash.com/photo-1599669454699-248893623440?w=800", alt: "HyperX Cloud III Wireless headset", position: 0 },
      ],
      stock: 40,
    },
    {
      name: "Ducky One 3 SF",
      slug: "ducky-one-3-sf",
      description:
        "65% form factor mechanical keyboard with hot-swappable switches, dual-layer dampening foam, PBT double-shot keycaps, and South-facing LEDs.",
      categoryId: categories["mechanical-keyboards"],
      brandId: brands["ducky"],
      price: 1399900,
      rating: 4.6,
      ratingCount: 178,
      soldCount: 720,
      images: [
        { url: "https://images.unsplash.com/photo-1541140532154-b024d705b90a?w=800", alt: "Ducky One 3 SF keyboard", position: 0 },
      ],
      variants: [
        { name: "Switch", value: "Cherry MX Red" },
        { name: "Switch", value: "Cherry MX Brown" },
        { name: "Switch", value: "Cherry MX Blue" },
      ],
      stock: 35,
    },
    {
      name: "Logitech G Pro X Superlight 2",
      slug: "logitech-g-pro-x-superlight-2",
      description:
        "Ultra-lightweight 60g wireless gaming mouse with HERO 2 sensor, 95-hour battery, LIGHTSPEED wireless, and zero-additive PTFE feet.",
      categoryId: categories["gaming-mice"],
      brandId: brands["logitech"],
      price: 1399900,
      compareAtPrice: 1599900,
      isFeatured: true,
      isBestSeller: true,
      rating: 4.9,
      ratingCount: 312,
      soldCount: 1560,
      images: [
        { url: "https://images.unsplash.com/photo-1615662550122-8bada98a5287?w=800", alt: "Logitech G Pro X Superlight 2", position: 0 },
      ],
      variants: [
        { name: "Color", value: "Black", price: 1399900 },
        { name: "Color", value: "White", price: 1399900 },
      ],
      stock: 60,
    },
    {
      name: "Corsair MM700 RGB Extended",
      slug: "corsair-mm700-rgb-extended",
      description:
        "Extended gaming mouse pad with 930mm x 400mm surface, 360° RGB lighting, built-in USB hub, and micro-textured woven surface.",
      categoryId: categories["mouse-pads"],
      brandId: brands["corsair"],
      price: 399900,
      compareAtPrice: 499900,
      rating: 4.4,
      ratingCount: 89,
      soldCount: 410,
      images: [
        { url: "https://images.unsplash.com/photo-1616353071857-43715085401a?w=800", alt: "Corsair MM700 RGB mouse pad", position: 0 },
      ],
      stock: 70,
    },
    {
      name: "Razer BlackShark V2 Pro",
      slug: "razer-blackshark-v2-pro",
      description:
        "Wireless esports headset with TriForce Titanium 50mm drivers, HyperClear Super Wideband Mic, THX Spatial Audio, and 70-hour battery.",
      categoryId: categories["audio"],
      brandId: brands["razer"],
      price: 1199900,
      rating: 4.6,
      ratingCount: 167,
      soldCount: 620,
      images: [
        { url: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800", alt: "Razer BlackShark V2 Pro headset", position: 0 },
      ],
      stock: 38,
    },
    {
      name: "Keychron Q2 Max",
      slug: "keychron-q2-max",
      description:
        "65% wireless mechanical keyboard with hot-swappable Gateron Jupiter switches, gasket mount design, double-shot PBT keycaps, and Bluetooth 5.1 + 2.4GHz connectivity.",
      categoryId: categories["mechanical-keyboards"],
      brandId: brands["keychron"],
      price: 1599900,
      isNewArrival: true,
      rating: 4.7,
      ratingCount: 92,
      soldCount: 310,
      images: [
        { url: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=800", alt: "Keychron Q2 Max keyboard", position: 0 },
      ],
      stock: 25,
    },
  ];

  for (const p of productData) {
    const { images, variants, stock, ...productFields } = p;

    const product = await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...productFields,
        images: { create: images },
      },
    });

    if (variants) {
      const existing = await prisma.productVariant.findFirst({
        where: { productId: product.id },
      });

      if (!existing) {
        await prisma.productVariant.createMany({
          data: variants.map((v, i) => ({
            productId: product.id,
            name: v.name,
            value: v.value,
            ...(v.price !== undefined ? { price: v.price } : {}),
            position: i,
          })),
        });
      }
    }

    const existingInventory = await prisma.inventory.findFirst({
      where: { productId: product.id, variantId: null, warehouse: "default" },
    });

    if (existingInventory) {
      await prisma.inventory.update({
        where: { id: existingInventory.id },
        data: { stock: stock ?? 50 },
      });
    } else {
      await prisma.inventory.create({
        data: {
          productId: product.id,
          stock: stock ?? 50,
          warehouse: "default",
        },
      });
    }
  }
  console.log(`✓ ${productData.length} products with images, variants, and inventory`);

  // Banners
  const bannerData = [
    {
      title: "New Arrivals Are Here",
      subtitle: "Discover the latest in gaming peripherals",
      image: "https://images.unsplash.com/photo-1598550476439-6847b7848eab?w=1200",
      ctaLabel: "Shop Now",
      ctaLink: "/products?sort=newest",
      position: "home_hero",
      order: 0,
    },
    {
      title: "Premium Mechanical Keyboards",
      subtitle: "Precision switches, premium builds",
      image: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=1200",
      ctaLabel: "Explore",
      ctaLink: "/products?category=mechanical-keyboards",
      position: "home_secondary",
      order: 0,
    },
  ];

  for (const banner of bannerData) {
    const existing = await prisma.banner.findFirst({
      where: { title: banner.title },
    });

    if (!existing) {
      await prisma.banner.create({ data: banner });
    }
  }
  console.log(`✓ ${bannerData.length} banners`);

  // Settings
  const settingsData: Record<string, Prisma.InputJsonValue> = {
    storeName: "Navrix",
    storeEmail: "support@navrixtech.in",
    storePhone: "+91 98765 43210",
    currency: "INR",
    freeShippingThreshold: 99900,
    flatShippingRate: 4900,
    taxRate: 0,
  };

  for (const [key, value] of Object.entries(settingsData)) {
    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }
  console.log(`✓ ${Object.keys(settingsData).length} settings`);

  console.log("\nSeed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
