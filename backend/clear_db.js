const bcrypt = require('bcryptjs');
const {
  sequelize,
  AdminUser,
  Salesman,
  Retailer,
  RetailerAddress,
  PaymentConfig
} = require('./database');

async function clearDatabase() {
  console.log('Syncing database (dropping all tables)...');
  // Sync database with force: true to wipe all existing records and tables
  await sequelize.sync({ force: true });
  console.log('Database synced. Seeding admin, payment config, salesman, and retailers...');

  const commonPasswordHash = await bcrypt.hash('password123', 12);

  // 1. Seed Admin
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);
  await AdminUser.create({
    name: 'Super Admin',
    email: 'admin@company.com',
    passwordHash: adminPasswordHash,
    role: 'super_admin'
  });
  console.log('Super Admin user seeded (admin@company.com / Admin@123).');

  // 2. Seed Payment Configs (required for portal configs to load correctly)
  const configs = [
    { paymentType: 'cod', label: 'Cash on Delivery (COD)', flatCharge: 50.00, percentageRate: 0.00 },
    { paymentType: 'qr_pay', label: 'QR Code Payment', flatCharge: 0.00, percentageRate: 0.00 },
    { paymentType: 'due_7', label: 'Due 7 Days', flatCharge: 0.00, percentageRate: 1.00 },
    { paymentType: 'due_15', label: 'Due 15 Days', flatCharge: 0.00, percentageRate: 2.00 },
    { paymentType: 'due_30', label: 'Due 30 Days', flatCharge: 0.00, percentageRate: 3.00 }
  ];
  for (const cfg of configs) {
    await PaymentConfig.create(cfg);
  }
  console.log('Payment configurations seeded.');

  // 3. Seed Salesman 1 (referenced by Retailers)
  const salesman = await Salesman.create({
    name: 'Salesman 1',
    mobileNumber: '9000000010',
    email: 'salesman1@company.com',
    passwordHash: commonPasswordHash,
    isActive: true
  });
  console.log('Salesman seeded.');

  // 4. Seed Retailers A, B, and C
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
    assignedSalesmanId: null
  });
  console.log('Retailers A, B, and C seeded.');

  // 5. Seed Retailer Addresses
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

  console.log('Database clearing completed successfully. Products, categories, and orders are empty. Retailers are preserved!');
  process.exit(0);
}

clearDatabase().catch(err => {
  console.error('Failed to clear database:', err);
  process.exit(1);
});
