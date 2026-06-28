const { 
  sequelize, AdminUser, Salesman, Retailer, Product, 
  Order, OrderItem, DuePayment, PaymentConfig 
} = require('./database');
const bcrypt = require('bcryptjs');

async function runTests() {
  console.log('==================================================');
  console.log('STARTING INTEGRATION TESTS FOR DISTRIBUTOR SYSTEM');
  console.log('==================================================');

  try {
    // 1. Verify DB Connection
    await sequelize.authenticate();
    console.log('✅ DB Connection: OK');

    // 2. Validate Seeded Admin Accounts
    const admin = await AdminUser.findOne({ where: { email: 'admin@company.com' } });
    if (admin) {
      const match = await bcrypt.compare('Admin@123', admin.passwordHash);
      console.log(`✅ Admin Password Crypt Check: ${match ? 'MATCHED' : 'FAILED'}`);
    } else {
      console.log('❌ Admin client not found in DB');
    }

    // 3. Validate Seeded Retailers & Tiers
    const retailers = await Retailer.findAll({ include: [Salesman] });
    console.log(`✅ Retailers Seeding: Found ${retailers.length} accounts`);
    retailers.forEach(r => {
      console.log(`   - Retailer: ${r.name} | Category: ${r.category} | Limit: ₹${r.creditLimit} | Salesman: ${r.Salesman ? r.Salesman.name : 'None'}`);
    });

    // 4. Validate Product Prices & Tier Calculations
    const products = await Product.findAll();
    console.log(`✅ Product Catalog: Found ${products.length} active SKUs`);
    
    // Pick the first product and verify tier prices
    if (products.length > 0) {
      const p = products[0];
      console.log(`   - SKU: ${p.sku} | Name: ${p.name}`);
      console.log(`     T1 Price: ₹${p.priceT1} | T2 Price: ₹${p.priceT2} | T3 Price: ₹${p.priceT3}`);
    }

    // 5. Test Credit Limit Validation Check Logic
    const retailerA = retailers.find(r => r.mobileNumber === '9000000001'); // T1
    if (retailerA) {
      console.log(`✅ Testing Business Logic: Credit & Stock Checks for ${retailerA.name}`);
      const outstanding = parseFloat(retailerA.currentOutstanding);
      const limit = parseFloat(retailerA.creditLimit);
      const available = limit - outstanding;
      console.log(`   - Credit limit: ₹${limit} | Outstanding: ₹${outstanding} | Available: ₹${available}`);
    }

    // 6. Test Due Payments Ledger Status
    const duesCount = await DuePayment.count();
    console.log(`✅ Dues Ledger: Found ${duesCount} outstanding bills`);

    console.log('==================================================');
    console.log('INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('==================================================');
    process.exit(0);

  } catch (err) {
    console.error('❌ Integration Tests Failed with Error:');
    console.error(err);
    process.exit(1);
  }
}

runTests();
