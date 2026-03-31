/**
 * Demo Data Generator for WooCommerce Next.js Store
 *
 * This script creates demo products, categories, and test data for development
 *
 * Usage:
 * 1. Set up your WooCommerce store with API credentials in .env.local
 * 2. Run: node scripts/seed-demo-data.js
 *
 * Note: This will create products in your live WooCommerce store!
 * Use a development/staging store for testing.
 */

require('dotenv').config();
const axios = require('axios');

// WooCommerce API credentials
const STORE_URL = process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL;
const CONSUMER_KEY = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET;

// Demo categories matching your gaming PC store
const categories = [
  { name: 'Graphics Cards', slug: 'graphics-cards', description: 'High-performance GPUs for gaming and rendering' },
  { name: 'Processors', slug: 'processors', description: 'Intel and AMD CPUs for gaming PCs' },
  { name: 'Memory', slug: 'memory', description: 'RAM modules and memory kits' },
  { name: 'Storage', slug: 'storage', description: 'SSDs and HDDs for your PC' },
  { name: 'Motherboards', slug: 'motherboards', description: 'ATX, Micro-ATX, and Mini-ITX boards' },
  { name: 'Power Supplies', slug: 'power-supplies', description: 'PSUs for all builds' },
  { name: 'Cooling', slug: 'cooling', description: 'Air coolers and liquid cooling' },
  { name: 'Peripherals', slug: 'peripherals', description: 'Keyboards, mice, monitors' },
];

// Demo products organized by category
const demoProducts = [
  // Graphics Cards
  {
    name: 'NVIDIA GeForce RTX 4090 Founders Edition',
    slug: 'nvidia-geforce-rtx-4090-founders-edition',
    type: 'simple',
    regular_price: '1599.99',
    description: '<p>The ultimate GPU for gaming and professional workloads. 24GB GDDR6X memory, ray tracing, and DLSS 3.0 support.</p>',
    short_description: '24GB GDDR6X | Ray Tracing | DLSS 3',
    sku: 'RTX4090-FE',
    categories: [{ name: 'Graphics Cards' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1591488320449-011701244670?w=800', name: 'RTX 4090', alt: 'NVIDIA RTX 4090' }
    ],
    stock_quantity: 15,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'AMD Radeon RX 7900 XTX',
    slug: 'amd-radeon-rx-7900-xtx',
    type: 'simple',
    regular_price: '999.99',
    description: '<p>AMD flagship GPU with 24GB GDDR6 memory. Excellent 4K gaming performance with ray acceleration.</p>',
    short_description: '24GB GDDR6 | 4K Gaming | RDNA 3',
    sku: 'RX7900XTX',
    categories: [{ name: 'Graphics Cards' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1627777232133-67b3c3e9b48f?w=800', name: 'RX 7900 XTX', alt: 'AMD Radeon RX 7900 XTX' }
    ],
    stock_quantity: 8,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'NVIDIA GeForce RTX 4070 Ti Super',
    slug: 'nvidia-geforce-rtx-4070-ti-super',
    type: 'simple',
    regular_price: '799.99',
    description: '<p>16GB GDDR6X memory. Perfect for high-refresh 1440p gaming.</p>',
    short_description: '16GB GDDR6X | 1440p Beast | DLSS 3',
    sku: 'RTX4070TIS',
    categories: [{ name: 'Graphics Cards' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1591405351990-4726e331f141?w=800', name: 'RTX 4070 Ti Super', alt: 'RTX 4070 Ti Super' }
    ],
    stock_quantity: 25,
    stock_status: 'instock',
    featured: false,
  },
  // Processors
  {
    name: 'Intel Core i9-14900K',
    slug: 'intel-core-i9-14900k',
    type: 'simple',
    regular_price: '589.99',
    description: '<p>24 cores (8P+16E), up to 6.0 GHz. The fastest gaming CPU.</p>',
    short_description: '24 Cores | 6.0 GHz | LGA1700',
    sku: 'I9-14900K',
    categories: [{ name: 'Processors' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1591790264340-84ae0512434f?w=800', name: 'Intel i9-14900K', alt: 'Intel Core i9-14900K' }
    ],
    stock_quantity: 30,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'AMD Ryzen 9 7950X',
    slug: 'amd-ryzen-9-7950x',
    type: 'simple',
    regular_price: '549.99',
    description: '<p>16-core, 32-thread Zen 4 processor. Excellent for gaming and content creation.</p>',
    short_description: '16 Cores | Zen 4 | DDR5',
    sku: 'R9-7950X',
    categories: [{ name: 'Processors' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1625274054928-64644ef00a07?w=800', name: 'AMD Ryzen 9', alt: 'AMD Ryzen 9 7950X' }
    ],
    stock_quantity: 20,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'Intel Core i5-14600K',
    slug: 'intel-core-i5-14600k',
    type: 'simple',
    regular_price: '319.99',
    description: '<p>14 cores (6P+8E), excellent price-to-performance for gaming.</p>',
    short_description: '14 Cores | Best Value | LGA1700',
    sku: 'I5-14600K',
    categories: [{ name: 'Processors' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1555618254-84d959631e59?w=800', name: 'Intel i5-14600K', alt: 'Intel Core i5-14600K' }
    ],
    stock_quantity: 50,
    stock_status: 'instock',
    featured: false,
  },
  // Memory
  {
    name: 'G.Skill Trident Z5 RGB 32GB DDR5-6000',
    slug: 'gskill-trident-z5-rgb-32gb-ddr5-6000',
    type: 'simple',
    regular_price: '149.99',
    description: '<p>32GB (2x16GB) DDR5-6000 CL30 with RGB lighting. Perfect for gaming builds.</p>',
    short_description: '32GB Kit | 6000MHz | RGB',
    sku: 'GSK-TZ5-32-6K',
    categories: [{ name: 'Memory' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=800', name: 'G.Skill RAM', alt: 'G.Skill Trident Z5 RGB' }
    ],
    stock_quantity: 100,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'Corsair Vengeance RGB 64GB DDR5-5600',
    slug: 'corsair-vengeance-rgb-64gb-ddr5-5600',
    type: 'simple',
    regular_price: '229.99',
    description: '<p>64GB (4x16GB) high-performance DDR5. For content creators and heavy multitaskers.</p>',
    short_description: '64GB Kit | 5600MHz | iCUE Compatible',
    sku: 'COR-VRGB-64-56',
    categories: [{ name: 'Memory' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1625240524109-6112e45daa0a?w=800', name: 'Corsair RAM', alt: 'Corsair Vengeance RGB' }
    ],
    stock_quantity: 40,
    stock_status: 'instock',
    featured: false,
  },
  // Storage
  {
    name: 'Samsung 990 Pro 2TB NVMe SSD',
    slug: 'samsung-990-pro-2tb-nvme-ssd',
    type: 'simple',
    regular_price: '179.99',
    description: '<p>Ultra-fast PCIe 4.0 SSD with up to 7450 MB/s read. Perfect for gaming and content creation.</p>',
    short_description: '2TB | 7450 MB/s | PCIe 4.0',
    sku: 'SAM-990P-2T',
    categories: [{ name: 'Storage' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd8e2?w=800', name: 'Samsung 990 Pro', alt: 'Samsung 990 Pro SSD' }
    ],
    stock_quantity: 75,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'Western Digital Black SN850X 1TB',
    slug: 'wd-black-sn850x-1tb',
    type: 'simple',
    regular_price: '89.99',
    description: '<p>High-performance gaming SSD with heatsink included. Up to 7300 MB/s.</p>',
    short_description: '1TB | 7300 MB/s | Heatsink',
    sku: 'WD-SN850X-1T',
    categories: [{ name: 'Storage' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1622979135228-d18336797823?w=800', name: 'WD Black SN850X', alt: 'WD Black SN850X' }
    ],
    stock_quantity: 60,
    stock_status: 'instock',
    featured: false,
  },
  // Motherboards
  {
    name: 'ASUS ROG Maximus Z790 Apex',
    slug: 'asus-rog-maximus-z790-apex',
    type: 'simple',
    regular_price: '699.99',
    description: '<p>Extreme overclocking motherboard with DDR5, PCIe 5.0, and Thunderbolt 4.</p>',
    short_description: 'Z790 | DDR5 | PCIe 5.0 | E-ATX',
    sku: 'ASUS-MAXZ790',
    categories: [{ name: 'Motherboards' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1587202372634-44173729a1d4?w=800', name: 'ASUS ROG Maximus', alt: 'ASUS ROG Maximus' }
    ],
    stock_quantity: 12,
    stock_status: 'instock',
    featured: true,
  },
  {
    name: 'MSI MPG Z790 Carbon WiFi',
    slug: 'msi-mpg-z790-carbon-wifi',
    type: 'simple',
    regular_price: '329.99',
    description: '<p>Excellent mid-range motherboard with WiFi 6E, DDR5 support, and great cooling.</p>',
    short_description: 'Z790 | DDR5 | WiFi 6E | ATX',
    sku: 'MSI-Z790CARB',
    categories: [{ name: 'Motherboards' }],
    images: [
      { src: 'https://images.unsplash.com/photo-1597249402729-0c5397c0c276?w=800', name: 'MSI Z790 Carbon', alt: 'MSI Z790 Carbon' }
    ],
    stock_quantity: 35,
    stock_status: 'instock',
    featured: false,
  },
];

async function createCategory(category) {
  try {
    const response = await axios.post(
      `${STORE_URL}/wp-json/wc/v3/products/categories`,
      category,
      {
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET,
        },
      }
    );
    console.log(`✓ Created category: ${category.name}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 400 && error.response?.data?.code === 'term_exists') {
      console.log(`→ Category exists: ${category.name}`);
      // Fetch existing category
      const existing = await axios.get(
        `${STORE_URL}/wp-json/wc/v3/products/categories?slug=${category.slug}`,
        {
          auth: {
            username: CONSUMER_KEY,
            password: CONSUMER_SECRET,
          },
        }
      );
      return existing.data[0];
    }
    console.error(`✗ Failed to create category ${category.name}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createProduct(product, categoryMap) {
  try {
    // Map category names to IDs
    const productCategoryIds = product.categories
      .map((cat) => categoryMap[cat.name])
      .filter(Boolean);

    const productData = {
      ...product,
      categories: productCategoryIds.map((id) => ({ id })),
    };

    const response = await axios.post(
      `${STORE_URL}/wp-json/wc/v3/products`,
      productData,
      {
        auth: {
          username: CONSUMER_KEY,
          password: CONSUMER_SECRET,
        },
      }
    );
    console.log(`✓ Created product: ${product.name} ($${product.regular_price})`);
    return response.data;
  } catch (error) {
    console.error(`✗ Failed to create product ${product.name}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('\n========================================');
  console.log('WooCommerce Demo Data Generator');
  console.log('========================================\n');

  // Validate environment variables
  if (!STORE_URL || !CONSUMER_KEY || !CONSUMER_SECRET) {
    console.error('❌ Missing environment variables!');
    console.error('Please set in .env.local:');
    console.error('  NEXT_PUBLIC_WOOCOMMERCE_STORE_URL');
    console.error('  NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_KEY');
    console.error('  NEXT_PUBLIC_WOOCOMMERCE_CONSUMER_SECRET');
    process.exit(1);
  }

  console.log(`Store URL: ${STORE_URL}`);
  console.log(`Categories to create: ${categories.length}`);
  console.log(`Products to create: ${demoProducts.length}\n`);

  // Ask for confirmation
  console.log('⚠️  This will create/update data in your WooCommerce store!');
  console.log('   Make sure you are using a development/staging store.\n');
  console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');

  await new Promise((resolve) => setTimeout(resolve, 5000));

  // Create categories
  console.log('\n--- Creating Categories ---\n');
  const categoryMap = {};
  for (const category of categories) {
    const created = await createCategory(category);
    if (created) {
      categoryMap[category.name] = created.id;
    }
    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  // Create products
  console.log('\n--- Creating Products ---\n');
  let createdCount = 0;
  for (const product of demoProducts) {
    const created = await createProduct(product, categoryMap);
    if (created) createdCount++;
    // Rate limit
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Summary
  console.log('\n========================================');
  console.log('Summary');
  console.log('========================================');
  console.log(`Categories: ${Object.keys(categoryMap).length}/${categories.length}`);
  console.log(`Products: ${createdCount}/${demoProducts.length}`);
  console.log('\n✅ Demo data setup complete!');
  console.log(`\nVisit your store: ${STORE_URL}/products`);
  console.log('Admin panel: ' + `${STORE_URL}/wp-admin`);
}

main().catch(console.error);
