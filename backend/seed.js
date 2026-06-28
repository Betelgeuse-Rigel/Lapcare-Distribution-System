const bcrypt = require('bcryptjs');
const {
  sequelize,
  AdminUser,
  Salesman,
  SalesmanTarget,
  Retailer,
  RetailerAddress,
  ProductCategory,
  Product,
  PaymentConfig
} = require('./database');

async function seed() {
  console.log('Syncing database...');
  // Force sync database to drop existing tables and recreate
  await sequelize.sync({ force: true });
  console.log('Database synced. Seeding data...');

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  const admin = await AdminUser.create({
    name: 'Super Admin',
    email: 'admin@company.com',
    passwordHash: adminPasswordHash,
    role: 'super_admin'
  });
  console.log('Admin user seeded.');

  // 2. Seed Payment Configs
  const configs = [
    { paymentType: 'cod', label: 'Cash on Delivery (COD)', flatCharge: 50.00, percentageRate: 0.00 },
    { paymentType: 'due_7', label: 'Due 7 Days', flatCharge: 0.00, percentageRate: 1.00 },
    { paymentType: 'due_15', label: 'Due 15 Days', flatCharge: 0.00, percentageRate: 2.00 }
  ];
  for (const cfg of configs) {
    await PaymentConfig.create(cfg);
  }
  console.log('Payment configurations seeded.');

  // 3. Seed Salesman
  const commonPasswordHash = await bcrypt.hash('password123', 12);
  const salesman = await Salesman.create({
    name: 'Salesman 1',
    mobileNumber: '9000000010',
    email: 'salesman1@company.com',
    passwordHash: commonPasswordHash,
    isActive: true
  });
  console.log('Salesman seeded.');

  // 4. Seed Salesman Targets
  const firstDayOfMonth = new Date();
  firstDayOfMonth.setDate(1);
  firstDayOfMonth.setHours(0, 0, 0, 0);

  await SalesmanTarget.create({
    salesmanId: salesman.id,
    month: firstDayOfMonth,
    targetOrders: 20,
    targetRevenue: 100000.00,
    targetDuesCollected: 50000.00
  });
  console.log('Salesman target seeded.');

  // 5. Seed Retailers
  const retailerA = await Retailer.create({
    name: 'Retailer A',
    mobileNumber: '9000000001',
    email: 'retailera@gmail.com',
    passwordHash: commonPasswordHash,
    category: 'T1',
    creditLimit: 50000.00,
    currentOutstanding: 0.00,
    assignedSalesmanId: salesman.id
  });

  const retailerB = await Retailer.create({
    name: 'Retailer B',
    mobileNumber: '9000000002',
    email: 'retailerb@gmail.com',
    passwordHash: commonPasswordHash,
    category: 'T2',
    creditLimit: 30000.00,
    currentOutstanding: 0.00,
    assignedSalesmanId: salesman.id
  });

  const retailerC = await Retailer.create({
    name: 'Retailer C',
    mobileNumber: '9000000003',
    email: 'retailerc@gmail.com',
    passwordHash: commonPasswordHash,
    category: 'T3',
    creditLimit: 20000.00,
    currentOutstanding: 0.00,
    assignedSalesmanId: null // No assigned salesman
  });
  console.log('Retailers A, B, and C seeded.');

  // 6. Seed Retailer Addresses
  await RetailerAddress.create({
    retailerId: retailerA.id,
    label: 'Main Shop',
    addressLine1: '12, Electronics Plaza',
    addressLine2: 'SP Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560002',
    isDefault: true
  });
  await RetailerAddress.create({
    retailerId: retailerA.id,
    label: 'Warehouse',
    addressLine1: '54/A, Industrial Area',
    addressLine2: 'Peenya',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560058',
    isDefault: false
  });

  await RetailerAddress.create({
    retailerId: retailerB.id,
    label: 'Headquarters',
    addressLine1: 'Shop 4B, Nehru Place',
    addressLine2: 'Outer Ring Road',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110019',
    isDefault: true
  });

  await RetailerAddress.create({
    retailerId: retailerC.id,
    label: 'Retail Store',
    addressLine1: 'Plot 25, Lamington Road',
    addressLine2: 'Grant Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400007',
    isDefault: true
  });
  console.log('Retailer addresses seeded.');

  // 7. Seed Product Categories
  const catComputer = await ProductCategory.create({ name: 'Computer', imageUrl: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?w=200&auto=format&fit=crop', sortOrder: 1 });
  const catElectronics = await ProductCategory.create({ name: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200&auto=format&fit=crop', sortOrder: 2 });
  const catCctv = await ProductCategory.create({ name: 'CCTV', imageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=200&auto=format&fit=crop', sortOrder: 3 });
  console.log('Product categories seeded.');

  // 8. Seed Products
  const products = [
    // Computer Category
    {
      name: 'Dell Vostro 15.6" Laptop',
      sku: 'DELL-VOSTRO-3510',
      brand: 'Dell',
      categoryId: catComputer.id,
      description: 'Intel Core i3, 8GB RAM, 512GB SSD, Windows 11 Home, 15.6 inch Screen.',
      priceT1: 32000.00, priceT2: 34000.00, priceT3: 36000.00,
      stockQuantity: 15, lowStockThreshold: 3,
      images: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&auto=format&fit=crop'],
      isFeatured: true
    },
    {
      name: 'HP LaserJet Pro MFP Printer',
      sku: 'HP-LASERJET-M126NW',
      brand: 'HP',
      categoryId: catComputer.id,
      description: 'Multi-function wireless monochrome laser printer, prints, copies, scans.',
      priceT1: 15000.00, priceT2: 16000.00, priceT3: 17000.00,
      stockQuantity: 8, lowStockThreshold: 2,
      images: ['https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop'],
      isFeatured: false
    },
    {
      name: 'Crucial 8GB DDR4 RAM 3200MHz',
      sku: 'CRUCIAL-DDR4-8GB',
      brand: 'Crucial',
      categoryId: catComputer.id,
      description: 'Crucial RAM 8GB DDR4 3200MHz CL22 Laptop Memory.',
      priceT1: 1800.00, priceT2: 1950.00, priceT3: 2100.00,
      stockQuantity: 50, lowStockThreshold: 10,
      images: ['https://images.unsplash.com/photo-1541029071515-84cc54f84dc5?w=500&auto=format&fit=crop'],
      isFeatured: true
    },
    {
      name: 'Samsung 980 500GB NVMe SSD',
      sku: 'SAMSUNG-980-500GB',
      brand: 'Samsung',
      categoryId: catComputer.id,
      description: 'Samsung PCIe 3.0 NVMe M.2 Internal Solid State Drive.',
      priceT1: 3500.00, priceT2: 3750.00, priceT3: 4000.00,
      stockQuantity: 2, lowStockThreshold: 5, // Low stock case
      images: ['https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=500&auto=format&fit=crop'],
      isFeatured: false
    },

    // Electronics Category
    {
      name: 'TP-Link AC1200 WiFi Router',
      sku: 'TPLINK-ARCHER-C6',
      brand: 'TP-Link',
      categoryId: catElectronics.id,
      description: 'Archer C6 Gigabit Router, Dual Band, 4 External Antennas.',
      priceT1: 2200.00, priceT2: 2400.00, priceT3: 2600.00,
      stockQuantity: 25, lowStockThreshold: 5,
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop'],
      isFeatured: true
    },
    {
      name: 'APC Easy UPS 600VA',
      sku: 'APC-UPS-600VA',
      brand: 'APC',
      categoryId: catElectronics.id,
      description: 'Back-UPS for computers and routers, 230V, battery backup & surge protection.',
      priceT1: 2900.00, priceT2: 3100.00, priceT3: 3300.00,
      stockQuantity: 12, lowStockThreshold: 3,
      images: ['https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&auto=format&fit=crop'],
      isFeatured: false
    },
    {
      name: 'Zebronics Wireless Keyboard & Mouse',
      sku: 'ZEB-COMPANION-107',
      brand: 'Zebronics',
      categoryId: catElectronics.id,
      description: 'Zebronics Companion 107 wireless keyboard and mouse combo.',
      priceT1: 850.00, priceT2: 950.00, priceT3: 1050.00,
      stockQuantity: 0, lowStockThreshold: 5, // Out of stock case
      images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&auto=format&fit=crop'],
      isFeatured: false
    },

    // CCTV Category
    {
      name: 'Hikvision 2MP Dome Camera',
      sku: 'HIK-DOME-2MP',
      brand: 'Hikvision',
      categoryId: catCctv.id,
      description: '1080p full HD indoor dome camera, 20m IR range, night vision.',
      priceT1: 1200.00, priceT2: 1350.00, priceT3: 1500.00,
      stockQuantity: 100, lowStockThreshold: 15,
      images: ['https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=500&auto=format&fit=crop'],
      isFeatured: true
    },
    {
      name: 'Hikvision 4-Channel DVR',
      sku: 'HIK-DVR-4CH',
      brand: 'Hikvision',
      categoryId: catCctv.id,
      description: 'Turbo HD 4-channel digital video recorder, supports H.265+, 1080p recording.',
      priceT1: 3500.00, priceT2: 3800.00, priceT3: 4100.00,
      stockQuantity: 30, lowStockThreshold: 5,
      images: ['https://images.unsplash.com/photo-1516216628859-9bccecad13ca?w=500&auto=format&fit=crop'],
      isFeatured: false
    },
    {
      name: 'CP Plus 5MP Bullet Camera',
      sku: 'CP-BULLET-5MP',
      brand: 'CP Plus',
      categoryId: catCctv.id,
      description: '5 Megapixel full color bullet camera, outdoor waterproof IP67, night vision.',
      priceT1: 1800.00, priceT2: 2000.00, priceT3: 2200.00,
      stockQuantity: 4, lowStockThreshold: 5, // Low stock case
      images: ['https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=500&auto=format&fit=crop'],
      isFeatured: true
    },
    {
      name: 'D-Link Cat6 UTP Lan Cable (305m)',
      sku: 'DLINK-CAT6-305M',
      brand: 'D-Link',
      categoryId: catCctv.id,
      description: 'Solid copper Cat6 network cable drum, high speed gigabit Ethernet transmission.',
      priceT1: 6500.00, priceT2: 7000.00, priceT3: 7500.00,
      stockQuantity: 15, lowStockThreshold: 3,
      images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&auto=format&fit=crop'],
      isFeatured: false
    }
  ];

  for (const prod of products) {
    await Product.create(prod);
  }
  console.log('Products seeded.');

  console.log('Seeding complete successfully.');
  process.exit(0);
}

seed().catch(err => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
