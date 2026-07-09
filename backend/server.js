// B2B Distributor Ordering System Server - Production Deploy Trigger
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


const {
  sequelize,
  AdminUser,
  Salesman,
  SalesmanTarget,
  Retailer,
  RetailerAddress,
  ProductCategory,
  Product,
  Order,
  OrderItem,
  DuePayment,
  DuePaymentTransaction,
  PaymentConfig,
  Notification
} = require('./database');

const app = express();
app.set('trust proxy', true);
const PORT = 5000;
const JWT_SECRET = 'b2b_distributor_super_secret_key';

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(morgan('dev'));
app.use('/api/uploads', express.static(uploadDir));
app.use('/uploads', express.static(uploadDir));

// Shared Live Log Queue for Frontend OTP/FCM Simulation
let liveLogs = [];
function addLiveLog(type, target, message) {
  const logEntry = {
    id: Date.now() + Math.random().toString(36).substr(2, 5),
    timestamp: new Date(),
    type, // 'SMS' or 'FCM' or 'SYSTEM'
    target, // e.g. Phone number, Retailer Name, Salesman Name
    message
  };
  liveLogs.push(logEntry);
  if (liveLogs.length > 50) liveLogs.shift(); // Keep last 50 logs
}

// Dynamic outstanding dues synchronizer helper
async function syncRetailerOutstanding(retailerId, transaction = null) {
  const options = transaction ? { transaction } : {};
  
  // Sum of all orders placed on credit that are NOT cancelled
  const orders = await Order.findAll({
    where: {
      retailerId,
      status: { [Op.ne]: 'cancelled' },
      paymentType: { [Op.in]: ['due_7', 'due_15', 'due_30'] }
    },
    ...options
  });
  
  const totalOrdersAmount = orders.reduce((sum, order) => sum + parseFloat(order.finalAmount || 0), 0);
  
  // Find all due payment records for this retailer
  const duePayments = await DuePayment.findAll({
    where: { retailerId },
    ...options
  });
  const duePaymentIds = duePayments.map(dp => dp.id);
  
  // Sum of all payments recorded
  let totalPaymentsAmount = 0;
  if (duePaymentIds.length > 0) {
    const payments = await DuePaymentTransaction.findAll({
      where: {
        duePaymentId: { [Op.in]: duePaymentIds }
      },
      ...options
    });
    totalPaymentsAmount = payments.reduce((sum, pay) => sum + parseFloat(pay.amountReceived || 0), 0);
  }
  
  const newOutstanding = Math.max(0, totalOrdersAmount - totalPaymentsAmount);
  
  // Update the retailer's currentOutstanding
  const retailer = await Retailer.findByPk(retailerId, options);
  if (retailer) {
    retailer.currentOutstanding = newOutstanding;
    await retailer.save(options);
  }
  
  return newOutstanding;
}

// REST Log Endpoint
app.get('/api/logs', (req, res) => {
  res.json(liveLogs);
});

// Clear Logs Endpoint
app.post('/api/logs/clear', (req, res) => {
  liveLogs = [];
  res.json({ success: true });
});

// Middleware: Authenticate Token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
}

// Middleware: Enforce Role
function enforceRole(roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden: Requires one of roles [${roles.join(', ')}]` });
    };
    next();
  };
}

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/send-otp
app.post('/api/auth/send-otp', async (req, res) => {
  const { mobileNumber } = req.body;
  if (!mobileNumber) return res.status(400).json({ error: 'Mobile number is required' });

  try {
    // Check if user is a Retailer or Salesman
    let user = await Retailer.findOne({ where: { mobileNumber, isActive: true } });
    let role = 'retailer';

    if (!user) {
      user = await Salesman.findOne({ where: { mobileNumber, isActive: true } });
      role = 'salesman';
    }

    if (!user) {
      return res.status(404).json({ error: 'User not registered or account inactive' });
    }

    // Generate a simple 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins expiry

    user.otp = otp;
    user.otpExpiresAt = otpExpiresAt;
    await user.save();

    // Log the OTP simulation
    addLiveLog('SMS', mobileNumber, `[MSG91] OTP to login as ${role} (${user.name}) is: ${otp}. Expires in 5 minutes.`);
    console.log(`[SMS OTP] Mobile: ${mobileNumber} | OTP: ${otp} | Role: ${role}`);

    res.json({ success: true, message: 'OTP sent successfully', simulatedOtp: otp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  const { mobileNumber, otp } = req.body;
  if (!mobileNumber || !otp) return res.status(400).json({ error: 'Mobile number and OTP are required' });

  try {
    let user = await Retailer.findOne({ where: { mobileNumber, isActive: true } });
    let role = 'retailer';

    if (!user) {
      user = await Salesman.findOne({ where: { mobileNumber, isActive: true } });
      role = 'salesman';
    }

    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.otp || user.otp !== otp || new Date() > new Date(user.otpExpiresAt)) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    // Clear OTP on success
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    // Create JWT
    const tokenPayload = {
      id: user.id,
      name: user.name,
      role: role,
      category: role === 'retailer' ? user.category : null
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role,
        email: user.email,
        mobileNumber: user.mobileNumber,
        category: tokenPayload.category
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, mobileNumber, email, password } = req.body;
  if (!name || !mobileNumber || !email || !password) {
    return res.status(400).json({ error: 'Name, mobile number, email, and password are required' });
  }

  try {
    // Check if retailer or salesman already exists
    const existingRetailer = await Retailer.findOne({
      where: {
        [Op.or]: [{ mobileNumber }, { email }]
      }
    });

    if (existingRetailer) {
      return res.status(400).json({ error: 'Mobile number or email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const retailer = await Retailer.create({
      name,
      mobileNumber,
      email,
      passwordHash,
      category: 'T3',
      creditLimit: 0.00,
      currentOutstanding: 0.00,
      isActive: true
    });

    // Create default address
    await RetailerAddress.create({
      retailerId: retailer.id,
      label: 'Store Default',
      addressLine1: 'Update Address Line 1',
      city: 'Unknown',
      state: 'Unknown',
      pincode: '000000',
      isDefault: true
    });

    // Create JWT
    const tokenPayload = {
      id: retailer.id,
      name: retailer.name,
      role: 'retailer',
      category: 'T3'
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      user: {
        id: retailer.id,
        name: retailer.name,
        role: 'retailer',
        email: retailer.email,
        mobileNumber: retailer.mobileNumber,
        category: 'T3'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login-password
app.post('/api/auth/login-password', async (req, res) => {
  const { mobileNumber, password } = req.body;
  if (!mobileNumber || !password) return res.status(400).json({ error: 'Mobile number and password are required' });

  try {
    let user = await Retailer.findOne({ where: { mobileNumber, isActive: true } });
    let role = 'retailer';

    if (!user) {
      user = await Salesman.findOne({ where: { mobileNumber, isActive: true } });
      role = 'salesman';
    }

    if (!user) return res.status(401).json({ error: 'Invalid credentials or inactive account' });

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenPayload = {
      id: user.id,
      name: user.name,
      role: role,
      category: role === 'retailer' ? user.category : null
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role,
        email: user.email,
        mobileNumber: user.mobileNumber,
        category: tokenPayload.category
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/auth/login
app.post('/api/admin/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const admin = await AdminUser.findOne({ where: { email, isActive: true } });
    if (!admin) return res.status(401).json({ error: 'Invalid credentials' });

    const passwordValid = await bcrypt.compare(password, admin.passwordHash);
    if (!passwordValid) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenPayload = {
      id: admin.id,
      name: admin.name,
      role: 'admin'
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: admin.id,
        name: admin.name,
        role: 'admin',
        email: admin.email
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});


// ==========================================
// 2. RETAILER FLOW ENDPOINTS
// ==========================================

// GET /api/retailer/profile
app.get('/api/retailer/profile', authenticateToken, enforceRole(['retailer']), async (req, res) => {
  try {
    const retailer = await Retailer.findByPk(req.user.id, {
      include: [RetailerAddress, Salesman]
    });
    res.json(retailer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/retailer/profile (Update details)
app.use('/api/retailer/addresses', authenticateToken, enforceRole(['retailer', 'salesman']));

// GET /api/retailer/dashboard
app.get('/api/retailer/dashboard', authenticateToken, enforceRole(['retailer']), async (req, res) => {
  try {
    await syncRetailerOutstanding(req.user.id);
    const retailer = await Retailer.findByPk(req.user.id);
    const pendingOrdersCount = await Order.count({
      where: { retailerId: req.user.id, status: { [Op.in]: ['pending', 'pending_approval'] } }
    });
    
    // Fetch featured products
    const featuredProducts = await Product.findAll({
      where: { isFeatured: true, isActive: true },
      limit: 6
    });

    res.json({
      retailer: {
        name: retailer.name,
        category: retailer.category,
        creditLimit: parseFloat(retailer.creditLimit),
        currentOutstanding: parseFloat(retailer.currentOutstanding),
        availableCredit: Math.max(0, parseFloat(retailer.creditLimit) - parseFloat(retailer.currentOutstanding)),
        creditTermRequest: retailer.creditTermRequest,
        creditTermApproved: retailer.creditTermApproved,
        creditRequestStatus: retailer.creditRequestStatus
      },
      pendingOrdersCount,
      featuredProducts: featuredProducts.map(p => {
        const prod = p.toJSON();
        // Return tier-specific price as single 'price' field
        prod.price = retailer.category === 'T1' ? prod.priceT1 : (retailer.category === 'T2' ? prod.priceT2 : prod.priceT3);
        delete prod.priceT1;
        delete prod.priceT2;
        delete prod.priceT3;
        return prod;
      })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/retailer/credit
app.get('/api/retailer/credit', authenticateToken, enforceRole(['retailer']), async (req, res) => {
  try {
    const retailer = await Retailer.findByPk(req.user.id);
    res.json({
      creditLimit: parseFloat(retailer.creditLimit),
      currentOutstanding: parseFloat(retailer.currentOutstanding),
      availableCredit: Math.max(0, parseFloat(retailer.creditLimit) - parseFloat(retailer.currentOutstanding))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/retailer/request-credit
app.post('/api/retailer/request-credit', authenticateToken, enforceRole(['retailer']), async (req, res) => {
  const { creditTermRequest } = req.body;
  if (!['none', 'due_7', 'due_15', 'due_30'].includes(creditTermRequest)) {
    return res.status(400).json({ error: 'Invalid credit term requested' });
  }
  
  try {
    const retailer = await Retailer.findByPk(req.user.id);
    if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
    
    retailer.creditTermRequest = creditTermRequest;
    retailer.creditRequestStatus = creditTermRequest === 'none' ? 'none' : 'pending';
    await retailer.save();
    
    addLiveLog('SYSTEM', retailer.name, `Submitted credit request for ${creditTermRequest.replace('_', ' ')}`);
    
    res.json({ success: true, retailer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ADDRESSES CRUD (Retailer/Salesman context)
app.get('/api/retailer/addresses', async (req, res) => {
  // If salesman requests, they must provide retailer_id query param
  const retailerId = req.user.role === 'salesman' ? req.query.retailerId : req.user.id;
  if (!retailerId) return res.status(400).json({ error: 'Retailer ID is required' });

  try {
    const addresses = await RetailerAddress.findAll({ where: { retailerId } });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/retailer/addresses', async (req, res) => {
  const retailerId = req.user.role === 'salesman' ? req.body.retailerId : req.user.id;
  const { label, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;
  if (!retailerId || !label || !addressLine1 || !city || !state || !pincode) {
    return res.status(400).json({ error: 'Required fields missing' });
  }

  try {
    if (isDefault) {
      // Clear defaults
      await RetailerAddress.update({ isDefault: false }, { where: { retailerId } });
    }
    const newAddress = await RetailerAddress.create({
      retailerId, label, addressLine1, addressLine2, city, state, pincode, isDefault: !!isDefault
    });
    res.json(newAddress);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/retailer/addresses/:id', async (req, res) => {
  const { id } = req.params;
  const retailerId = req.user.role === 'salesman' ? req.body.retailerId : req.user.id;
  const { label, addressLine1, addressLine2, city, state, pincode, isDefault } = req.body;

  try {
    const address = await RetailerAddress.findOne({ where: { id, retailerId } });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    if (isDefault) {
      await RetailerAddress.update({ isDefault: false }, { where: { retailerId } });
    }

    await address.update({
      label, addressLine1, addressLine2, city, state, pincode, isDefault: !!isDefault
    });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/retailer/addresses/:id', async (req, res) => {
  const { id } = req.params;
  const retailerId = req.user.role === 'salesman' ? req.query.retailerId : req.user.id;

  try {
    const address = await RetailerAddress.findOne({ where: { id, retailerId } });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    await address.destroy();
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/retailer/addresses/:id/default', async (req, res) => {
  const { id } = req.params;
  const retailerId = req.user.role === 'salesman' ? req.body.retailerId : req.user.id;

  try {
    const address = await RetailerAddress.findOne({ where: { id, retailerId } });
    if (!address) return res.status(404).json({ error: 'Address not found' });

    await RetailerAddress.update({ isDefault: false }, { where: { retailerId } });
    await address.update({ isDefault: true });
    res.json(address);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 3. SALESMAN FLOW ENDPOINTS
// ==========================================

// GET /api/salesman/profile
app.get('/api/salesman/profile', authenticateToken, enforceRole(['salesman']), async (req, res) => {
  try {
    const salesman = await Salesman.findByPk(req.user.id);
    res.json(salesman);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salesman/dashboard
app.get('/api/salesman/dashboard', authenticateToken, enforceRole(['salesman']), async (req, res) => {
  try {
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const target = await SalesmanTarget.findOne({
      where: { salesmanId: req.user.id, month: firstDayOfMonth }
    });

    // Calculate actual metrics for this salesman this month
    const assignedRetailers = await Retailer.findAll({ where: { assignedSalesmanId: req.user.id } });
    const assignedRetailerIds = assignedRetailers.map(r => r.id);

    // Month filter for order placements
    const startOfMonthDate = firstDayOfMonth;
    const endOfMonthDate = new Date(firstDayOfMonth.getFullYear(), firstDayOfMonth.getMonth() + 1, 0, 23, 59, 59);

    // Orders placed by this salesman
    const ordersPlacedCount = await Order.count({
      where: {
        placedByRole: 'salesman',
        placedById: req.user.id,
        placedAt: { [Op.between]: [startOfMonthDate, endOfMonthDate] }
      }
    });

    // Revenue generated (finalAmount sum of confirmed/delivered orders for assigned retailers in this month)
    const confirmedOrders = await Order.findAll({
      where: {
        retailerId: { [Op.in]: assignedRetailerIds },
        status: { [Op.in]: ['confirmed', 'packed', 'shipped', 'delivered'] },
        placedAt: { [Op.between]: [startOfMonthDate, endOfMonthDate] }
      }
    });
    const revenueGenerated = confirmedOrders.reduce((sum, order) => sum + parseFloat(order.finalAmount), 0);

    // Dues collected this month (DuePaymentTransactions recorded for this salesman's retailers)
    // For simplicity, we get transactions recorded this month against outstanding dues of their retailers
    const duePayments = await DuePayment.findAll({
      where: { retailerId: { [Op.in]: assignedRetailerIds } }
    });
    const duePaymentIds = duePayments.map(dp => dp.id);

    const transactions = await DuePaymentTransaction.findAll({
      where: {
        duePaymentId: { [Op.in]: duePaymentIds },
        recordedAt: { [Op.between]: [startOfMonthDate, endOfMonthDate] }
      }
    });
    const duesCollected = transactions.reduce((sum, tx) => sum + parseFloat(tx.amountReceived), 0);

    res.json({
      targets: target ? {
        orders: target.targetOrders,
        revenue: parseFloat(target.targetRevenue),
        dues: parseFloat(target.targetDuesCollected)
      } : { orders: 0, revenue: 0, dues: 0 },
      actual: {
        orders: ordersPlacedCount,
        revenue: revenueGenerated,
        dues: duesCollected
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salesman/retailers
app.get('/api/salesman/retailers', authenticateToken, enforceRole(['salesman']), async (req, res) => {
  try {
    const retailers = await Retailer.findAll({
      where: { assignedSalesmanId: req.user.id, isActive: true },
      include: [RetailerAddress]
    });
    res.json(retailers.map(r => {
      const ret = r.toJSON();
      ret.availableCredit = Math.max(0, parseFloat(r.creditLimit) - parseFloat(r.currentOutstanding));
      return ret;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salesman/retailers/:id
app.get('/api/salesman/retailers/:id', authenticateToken, enforceRole(['salesman']), async (req, res) => {
  const { id } = req.params;
  try {
    const retailer = await Retailer.findOne({
      where: { id, assignedSalesmanId: req.user.id, isActive: true },
      include: [RetailerAddress]
    });

    if (!retailer) return res.status(404).json({ error: 'Retailer not assigned to this salesman' });

    const orders = await Order.findAll({ where: { retailerId: id }, order: [['placedAt', 'DESC']], limit: 10 });
    const dues = await DuePayment.findAll({ where: { retailerId: id, status: { [Op.ne]: 'paid' } } });

    res.json({
      retailer: {
        ...retailer.toJSON(),
        availableCredit: Math.max(0, parseFloat(retailer.creditLimit) - parseFloat(retailer.currentOutstanding))
      },
      recentOrders: orders,
      activeDues: dues
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salesman/retailers/:id/addresses
app.get('/api/salesman/retailers/:id/addresses', authenticateToken, enforceRole(['salesman']), async (req, res) => {
  const { id } = req.params;
  try {
    const isAssigned = await Retailer.findOne({ where: { id, assignedSalesmanId: req.user.id } });
    if (!isAssigned) return res.status(404).json({ error: 'Retailer not assigned to this salesman' });

    const addresses = await RetailerAddress.findAll({ where: { retailerId: id } });
    res.json(addresses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 4. PRODUCTS & CATEGORIES API
// ==========================================

// GET /api/products/categories
app.get('/api/products/categories', authenticateToken, enforceRole(['retailer', 'salesman', 'admin']), async (req, res) => {
  try {
    const categories = await ProductCategory.findAll({ where: { isActive: true }, order: [['sortOrder', 'ASC']] });
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products
app.get('/api/products', authenticateToken, enforceRole(['retailer', 'salesman', 'admin']), async (req, res) => {
  const { categoryId, q, retailerId } = req.query;
  
  try {
    let targetCategory = req.user.category; // Retailer's category T1/T2/T3
    
    // For salesman/admin context: pricing depends on selected retailer context
    if (req.user.role === 'salesman' || req.user.role === 'admin') {
      if (!retailerId) {
        return res.status(400).json({ error: 'retailerId query parameter is required for salesman/admin' });
      }
      
      const retailer = await Retailer.findByPk(retailerId);
      if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
      
      // If salesman, verify assignment
      if (req.user.role === 'salesman' && retailer.assignedSalesmanId !== req.user.id) {
        return res.status(403).json({ error: 'Retailer is not assigned to this salesman' });
      }
      
      targetCategory = retailer.category;
    }

    // Build filters
    const where = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (q) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${q}%` } },
        { brand: { [Op.iLike]: `%${q}%` } },
        { sku: { [Op.iLike]: `%${q}%` } }
      ];
    }

    const products = await Product.findAll({ where, order: [['name', 'ASC']] });
    
    // Map list applying tier pricing context
    const pricedProducts = products.map(p => {
      const prod = p.toJSON();
      
      // Select single price field
      prod.price = targetCategory === 'T1' ? prod.priceT1 : (targetCategory === 'T2' ? prod.priceT2 : prod.priceT3);
      delete prod.priceT1;
      delete prod.priceT2;
      delete prod.priceT3;
      
      // Add text label stock status
      if (prod.stockQuantity === 0) {
        prod.stockStatus = 'Out of Stock';
      } else if (prod.stockQuantity <= prod.lowStockThreshold) {
        prod.stockStatus = 'Low Stock';
      } else {
        prod.stockStatus = 'In Stock';
      }
      
      return prod;
    });

    res.json(pricedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', authenticateToken, enforceRole(['retailer', 'salesman', 'admin']), async (req, res) => {
  const { id } = req.params;
  const { retailerId } = req.query;

  try {
    const p = await Product.findByPk(id);
    if (!p) return res.status(404).json({ error: 'Product not found' });

    let targetCategory = req.user.category;
    if (req.user.role === 'salesman' || req.user.role === 'admin') {
      if (!retailerId) return res.status(400).json({ error: 'retailerId query parameter is required' });
      const retailer = await Retailer.findByPk(retailerId);
      if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
      targetCategory = retailer.category;
    }

    const prod = p.toJSON();
    prod.price = targetCategory === 'T1' ? prod.priceT1 : (targetCategory === 'T2' ? prod.priceT2 : prod.priceT3);
    delete prod.priceT1;
    delete prod.priceT2;
    delete prod.priceT3;

    if (prod.stockQuantity === 0) {
      prod.stockStatus = 'Out of Stock';
    } else if (prod.stockQuantity <= prod.lowStockThreshold) {
      prod.stockStatus = 'Low Stock';
    } else {
      prod.stockStatus = 'In Stock';
    }

    res.json(prod);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 5. ORDERS API
// ==========================================

// Helper: Generate Order Number (ORD-YYYYMMDD-XXXX)
async function generateOrderNumber() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() + 
                  (now.getMonth() + 1).toString().padStart(2, '0') + 
                  now.getDate().toString().padStart(2, '0');
  
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  const count = await Order.count({
    where: {
      placedAt: { [Op.between]: [startOfDay, endOfDay] }
    }
  });

  const seq = (count + 1).toString().padStart(4, '0');
  return `ORD-${dateStr}-${seq}`;
}

// POST /api/orders/generate-otp
app.post('/api/orders/generate-otp', authenticateToken, enforceRole(['salesman']), async (req, res) => {
  const { retailerId } = req.body;
  if (!retailerId) return res.status(400).json({ error: 'Retailer ID is required' });
  
  try {
    const retailer = await Retailer.findByPk(retailerId);
    if (!retailer || !retailer.isActive) {
      return res.status(404).json({ error: 'Retailer not found or inactive' });
    }
    
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    retailer.orderOtp = otpCode;
    retailer.orderOtpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    await retailer.save();
    
    addLiveLog('SMS', retailer.mobileNumber, `[OTP Simulation] Order Verification Code: ${otpCode}. Valid for 10 minutes.`);
    
    res.json({ success: true, message: 'Order verification OTP generated', otpSim: otpCode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/orders
app.post('/api/orders', authenticateToken, enforceRole(['retailer', 'salesman']), async (req, res) => {
  const { retailerId, items, paymentType, deliveryAddressId } = req.body;
  
  // Validation
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is empty or missing' });
  }
  if (!paymentType || !['cod', 'due_7', 'due_15', 'due_30', 'qr_pay'].includes(paymentType)) {
    return res.status(400).json({ error: 'Invalid or missing paymentType' });
  }
  if (!deliveryAddressId) {
    return res.status(400).json({ error: 'Delivery address is required' });
  }

  // Resolve Retailer
  const targetRetailerId = req.user.role === 'salesman' ? retailerId : req.user.id;
  if (!targetRetailerId) return res.status(400).json({ error: 'Retailer ID is required' });

  const t = await sequelize.transaction();
  try {
    const retailer = await Retailer.findByPk(targetRetailerId, { transaction: t });
    if (!retailer || !retailer.isActive) {
      await t.rollback();
      return res.status(404).json({ error: 'Retailer account not active or not found' });
    }

    // Credit period verification
    if (['due_7', 'due_15', 'due_30'].includes(paymentType)) {
      let allowed = false;
      const approved = retailer.creditTermApproved;
      if (paymentType === 'due_7' && ['due_7', 'due_15', 'due_30'].includes(approved)) allowed = true;
      if (paymentType === 'due_15' && ['due_15', 'due_30'].includes(approved)) allowed = true;
      if (paymentType === 'due_30' && approved === 'due_30') allowed = true;
      
      if (!allowed) {
        await t.rollback();
        return res.status(403).json({ error: `Retailer is not approved for credit payment term: ${paymentType.replace('_', ' ')}` });
      }
    }

    // Verify salesman assignment and order verification OTP
    if (req.user.role === 'salesman') {
      if (retailer.assignedSalesmanId !== req.user.id) {
        await t.rollback();
        return res.status(403).json({ error: 'Retailer is not assigned to you' });
      }

      const { orderOtp } = req.body;
      if (!orderOtp) {
        await t.rollback();
        return res.status(400).json({ error: 'Order verification OTP is required' });
      }

      if (retailer.orderOtp !== orderOtp || new Date() > new Date(retailer.orderOtpExpiresAt)) {
        await t.rollback();
        return res.status(400).json({ error: 'Invalid or expired order verification OTP' });
      }

      // Clear the OTP fields on successful checkout verification
      retailer.orderOtp = null;
      retailer.orderOtpExpiresAt = null;
      await retailer.save({ transaction: t });
    }

    // Fetch delivery address
    const address = await RetailerAddress.findOne({
      where: { id: deliveryAddressId, retailerId: targetRetailerId },
      transaction: t
    });
    if (!address) {
      await t.rollback();
      return res.status(404).json({ error: 'Delivery address not found for this retailer' });
    }

    // Load active payment config surcharge
    const payConfig = await PaymentConfig.findOne({ where: { paymentType }, transaction: t });
    if (!payConfig) {
      await t.rollback();
      return res.status(500).json({ error: 'Payment method config not found' });
    }

    // Validate stock and calculate prices inside database transaction
    let totalProductAmount = 0;
    const orderItemsToCreate = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!product || !product.isActive) {
        await t.rollback();
        return res.status(404).json({ error: `Product SKU ${item.sku || item.productId} not found or inactive` });
      }

      if (product.stockQuantity < item.quantity) {
        await t.rollback();
        return res.status(400).json({
          error: `Insufficient stock for product ${product.name}. Available: ${product.stockQuantity}, Requested: ${item.quantity}`
        });
      }

      // Deduct Stock
      product.stockQuantity -= item.quantity;
      await product.save({ transaction: t });

      // Determine price
      const price = retailer.category === 'T1' ? product.priceT1 : (retailer.category === 'T2' ? product.priceT2 : product.priceT3);
      const subtotal = parseFloat(price) * item.quantity;
      totalProductAmount += subtotal;

      orderItemsToCreate.push({
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unitPrice: price,
        quantity: item.quantity,
        subtotal
      });
    }

    // Calculate Surcharge & Final Amount
    let surchargeAmount = 0;
    if (paymentType === 'cod') {
      surchargeAmount = parseFloat(payConfig.flatCharge);
    } else {
      surchargeAmount = totalProductAmount * (parseFloat(payConfig.percentageRate) / 100);
    }
    const finalAmount = totalProductAmount + surchargeAmount;

    // Credit Check
    const availableCredit = parseFloat(retailer.creditLimit) - parseFloat(retailer.currentOutstanding);
    let orderStatus = 'pending';
    let creditApprovalStatus = 'not_required';

    if (finalAmount > availableCredit) {
      orderStatus = 'pending_approval';
      creditApprovalStatus = 'pending';
    }

    // Generate Order Number
    const orderNumber = await generateOrderNumber();

    // Create Order
    const order = await Order.create({
      retailerId: targetRetailerId,
      placedByRole: req.user.role,
      placedById: req.user.id,
      orderNumber,
      deliveryAddressSnapshot: address.toJSON(),
      totalProductAmount,
      paymentType,
      surchargeAmount,
      finalAmount,
      status: orderStatus,
      creditApprovalStatus
    }, { transaction: t });

    // Create Order Items
    for (const item of orderItemsToCreate) {
      item.orderId = order.id;
      await OrderItem.create(item, { transaction: t });
    }

    // Commit Transaction
    await t.commit();

    // Send Real-time Simulated notifications
    let fcmTitle = '';
    let fcmBody = '';
    
    if (orderStatus === 'pending_approval') {
      // Notify Admin
      addLiveLog('FCM', 'Admin', `[ALERT] Credit approval required: Order ${orderNumber} placed by ${req.user.name} for ${retailer.name} (Amount: ₹${finalAmount.toFixed(2)}) exceeds credit available (₹${availableCredit.toFixed(2)}).`);
      
      // Notify Retailer
      fcmTitle = 'Order Awaiting Approval';
      fcmBody = `Your order ${orderNumber} exceeds your credit limit and is awaiting admin approval.`;
      await Notification.create({ recipientRole: 'retailer', recipientId: targetRetailerId, title: fcmTitle, body: fcmBody, type: 'credit_approval_required' });
      addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

      if (req.user.role === 'salesman') {
        const salesmanNotifyTitle = 'Order Awaiting Approval';
        const salesmanNotifyBody = `Order ${orderNumber} for ${retailer.name} is awaiting admin credit approval.`;
        await Notification.create({ recipientRole: 'salesman', recipientId: req.user.id, title: salesmanNotifyTitle, body: salesmanNotifyBody, type: 'credit_approval_required' });
        addLiveLog('FCM', req.user.name, `[Notification] ${salesmanNotifyTitle}: ${salesmanNotifyBody}`);
      }
    } else {
      // Normal Placed Order
      fcmTitle = 'Order Placed';
      fcmBody = `Order ${orderNumber} placed successfully.`;
      await Notification.create({ recipientRole: 'retailer', recipientId: targetRetailerId, title: fcmTitle, body: fcmBody, type: 'order_placed' });
      addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

      if (req.user.role === 'salesman') {
        const salesmanNotifyTitle = 'Order Placed';
        const salesmanNotifyBody = `Order ${orderNumber} placed for ${retailer.name}.`;
        await Notification.create({ recipientRole: 'salesman', recipientId: req.user.id, title: salesmanNotifyTitle, body: salesmanNotifyBody, type: 'order_placed' });
        addLiveLog('FCM', req.user.name, `[Notification] ${salesmanNotifyTitle}: ${salesmanNotifyBody}`);
      }
    }

    res.status(201).json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      finalAmount: parseFloat(order.finalAmount),
      creditApprovalStatus: order.creditApprovalStatus
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders
app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'retailer') {
      whereClause.retailerId = req.user.id;
    } else if (req.user.role === 'salesman') {
      // Find assigned retailers
      const retailers = await Retailer.findAll({ where: { assignedSalesmanId: req.user.id } });
      const retailerIds = retailers.map(r => r.id);
      whereClause.retailerId = { [Op.in]: retailerIds };
    } // Admin sees all

    const orders = await Order.findAll({
      where: whereClause,
      include: [OrderItem, Retailer],
      order: [['placedAt', 'DESC']]
    });

    res.json(orders.map(o => {
      const order = o.toJSON();
      if (req.user.role === 'salesman' && order.placedByRole === 'salesman' && order.placedById === req.user.id) {
        order.placedByYou = true;
      }
      return order;
    }));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/orders/:id
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const order = await Order.findByPk(id, { include: [OrderItem, Retailer] });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization checks
    if (req.user.role === 'retailer' && order.retailerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this order' });
    }
    if (req.user.role === 'salesman') {
      const retailer = await Retailer.findByPk(order.retailerId);
      if (retailer.assignedSalesmanId !== req.user.id) {
        return res.status(403).json({ error: 'Unauthorized to view this order' });
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/orders/:id/cancel
app.put('/api/orders/:id/cancel', authenticateToken, enforceRole(['retailer', 'salesman']), async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    // Authorization
    const targetRetailerId = req.user.role === 'salesman' ? order.retailerId : req.user.id;
    if (order.retailerId !== targetRetailerId) {
      return res.status(403).json({ error: 'Unauthorized to cancel this order' });
    }
    if (req.user.role === 'salesman') {
      const retailer = await Retailer.findByPk(order.retailerId);
      if (retailer.assignedSalesmanId !== req.user.id) {
        return res.status(403).json({ error: 'Retailer is not assigned to you' });
      }
    }

    // Status check: can cancel only if pending or pending_approval
    if (!['pending', 'pending_approval'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel order once it is confirmed or processed' });
    }

    // Refund stock inside database transaction
    const t = await sequelize.transaction();
    try {
      const items = await OrderItem.findAll({ where: { orderId: id }, transaction: t });
      for (const item of items) {
        const prod = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
        if (prod) {
          prod.stockQuantity += item.quantity;
          await prod.save({ transaction: t });
        }
      }
      
      order.status = 'cancelled';
      await order.save({ transaction: t });
      await syncRetailerOutstanding(order.retailerId, t);
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // Send notifications
    const retailer = await Retailer.findByPk(order.retailerId);
    const fcmTitle = 'Order Cancelled';
    const fcmBody = `Order ${order.orderNumber} has been successfully cancelled.`;
    await Notification.create({ recipientRole: 'retailer', recipientId: order.retailerId, title: fcmTitle, body: fcmBody, type: 'order_status_update' });
    addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

    res.json({ success: true, message: 'Order cancelled successfully', status: 'cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 6. DUE PAYMENTS API
// ==========================================

// GET /api/dues
app.get('/api/dues', authenticateToken, enforceRole(['retailer', 'salesman']), async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'retailer') {
      whereClause.retailerId = req.user.id;
    } else if (req.user.role === 'salesman') {
      // Find assigned retailers
      const retailers = await Retailer.findAll({ where: { assignedSalesmanId: req.user.id } });
      const retailerIds = retailers.map(r => r.id);
      whereClause.retailerId = { [Op.in]: retailerIds };
    }

    const dues = await DuePayment.findAll({
      where: whereClause,
      include: [Order, Retailer],
      order: [['dueDate', 'ASC']]
    });

    res.json(dues);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/dues/summary
app.get('/api/dues/summary', authenticateToken, enforceRole(['retailer', 'salesman']), async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role === 'retailer') {
      whereClause.retailerId = req.user.id;
    } else if (req.user.role === 'salesman') {
      const retailers = await Retailer.findAll({ where: { assignedSalesmanId: req.user.id } });
      const retailerIds = retailers.map(r => r.id);
      whereClause.retailerId = { [Op.in]: retailerIds };
    }

    const dues = await DuePayment.findAll({
      where: { ...whereClause, status: { [Op.ne]: 'paid' } }
    });

    const totalOutstanding = dues.reduce((sum, dp) => sum + parseFloat(dp.balanceDue), 0);
    const overdueDues = dues.filter(dp => dp.status === 'overdue' || new Date(dp.dueDate) < new Date());
    const totalOverdue = overdueDues.reduce((sum, dp) => sum + parseFloat(dp.balanceDue), 0);

    res.json({
      totalOutstanding,
      totalOverdue,
      count: dues.length,
      overdueCount: overdueDues.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 7. NOTIFICATIONS API
// ==========================================

// GET /api/notifications
app.get('/api/notifications', authenticateToken, enforceRole(['retailer', 'salesman']), async (req, res) => {
  try {
    const list = await Notification.findAll({
      where: { recipientRole: req.user.role, recipientId: req.user.id },
      order: [['sentAt', 'DESC']],
      limit: 50
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/:id/read
app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const notify = await Notification.findOne({
      where: { id, recipientRole: req.user.role, recipientId: req.user.id }
    });
    if (!notify) return res.status(404).json({ error: 'Notification not found' });
    
    notify.isRead = true;
    await notify.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/notifications/read-all
app.put('/api/notifications/read-all', authenticateToken, async (req, res) => {
  try {
    await Notification.update(
      { isRead: true },
      { where: { recipientRole: req.user.role, recipientId: req.user.id } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ==========================================
// 8. ADMIN CONTROL API
// ==========================================

// Middleware: Authenticate Admin ONLY
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ error: 'Access token missing' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Requires admin privileges' });
    }
    req.user = user;
    next();
  });
}

// POST /api/admin/upload
app.post('/api/admin/upload', authenticateAdmin, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/api/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl });
});

// GET /api/admin/dashboard
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    // Sync outstanding balance for all retailers to ensure dashboard accuracy
    const allRetailers = await Retailer.findAll({ attributes: ['id'] });
    for (const ret of allRetailers) {
      await syncRetailerOutstanding(ret.id);
    }

    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    // KPI Cards
    const todayOrdersCount = await Order.count({ where: { placedAt: { [Op.between]: [startOfToday, endOfToday] } } });
    const todayOrders = await Order.findAll({ where: { placedAt: { [Op.between]: [startOfToday, endOfToday] } } });
    const todayOrdersValue = todayOrders.reduce((sum, o) => sum + parseFloat(o.finalAmount), 0);

    const pendingApprovalsCount = await Order.count({ where: { status: 'pending_approval' } });
    
    const activeDuesList = await DuePayment.findAll({ where: { status: 'active' } });
    const totalActiveDues = activeDuesList.reduce((sum, dp) => sum + parseFloat(dp.balanceDue), 0);

    const overdueDuesList = await DuePayment.findAll({ where: { status: 'overdue' } });
    const totalOverdueDues = overdueDuesList.reduce((sum, dp) => sum + parseFloat(dp.balanceDue), 0);

    // Dues tables
    const highestOutstandingRetailers = await Retailer.findAll({
      where: { currentOutstanding: { [Op.gt]: 0 } },
      order: [['currentOutstanding', 'DESC']],
      limit: 10
    });

    const topRetailers = await Retailer.findAll({
      order: [['currentOutstanding', 'DESC']],
      limit: 5
    });

    // Inactive Retailers (No orders in 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const activeRetailerIds = (await Order.findAll({
      attributes: ['retailerId'],
      where: { placedAt: { [Op.gt]: thirtyDaysAgo } },
      group: ['retailerId']
    })).map(o => o.retailerId);

    const inactiveRetailers = await Retailer.findAll({
      where: {
        id: { [Op.notIn]: activeRetailerIds.length > 0 ? activeRetailerIds : [-1] },
        isActive: true
      },
      limit: 10
    });

    // Salesmen Target Performances
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    const salesmen = await Salesman.findAll({ where: { isActive: true } });
    const salesmanPerformances = [];

    for (const sm of salesmen) {
      const target = await SalesmanTarget.findOne({ where: { salesmanId: sm.id, month: firstDayOfMonth } });
      const retailers = await Retailer.findAll({ where: { assignedSalesmanId: sm.id } });
      const retailerIds = retailers.map(r => r.id);

      const ordersPlaced = await Order.count({
        where: { placedByRole: 'salesman', placedById: sm.id, placedAt: { [Op.gt]: firstDayOfMonth } }
      });

      const monthOrders = await Order.findAll({
        where: { retailerId: { [Op.in]: retailerIds }, status: { [Op.in]: ['confirmed', 'packed', 'shipped', 'delivered'] }, placedAt: { [Op.gt]: firstDayOfMonth } }
      });
      const revenue = monthOrders.reduce((sum, o) => sum + parseFloat(o.finalAmount), 0);

      const duesList = await DuePayment.findAll({ where: { retailerId: { [Op.in]: retailerIds } } });
      const dueIds = duesList.map(d => d.id);
      const txs = await DuePaymentTransaction.findAll({
        where: { duePaymentId: { [Op.in]: dueIds }, recordedAt: { [Op.gt]: firstDayOfMonth } }
      });
      const duesCollected = txs.reduce((sum, tx) => sum + parseFloat(tx.amountReceived), 0);

      salesmanPerformances.push({
        id: sm.id,
        name: sm.name,
        targets: target ? {
          orders: target.targetOrders,
          revenue: parseFloat(target.targetRevenue),
          dues: parseFloat(target.targetDuesCollected)
        } : { orders: 0, revenue: 0, dues: 0 },
        actual: {
          orders: ordersPlaced,
          revenue,
          dues: duesCollected
        }
      });
    }

    res.json({
      kpis: {
        todayOrdersCount,
        todayOrdersValue,
        pendingApprovalsCount,
        totalActiveDues,
        totalOverdueDues
      },
      highestOutstandingRetailers,
      topRetailers,
      inactiveRetailers,
      salesmanPerformances
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// SALESMAN CRUD
app.get('/api/admin/salesmen', authenticateAdmin, async (req, res) => {
  try {
    const list = await Salesman.findAll({
      include: [Retailer]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/salesmen', authenticateAdmin, async (req, res) => {
  const { name, mobileNumber, email, password } = req.body;
  if (!name || !mobileNumber || !email || !password) {
    return res.status(400).json({ error: 'Missing fields' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const sm = await Salesman.create({ name, mobileNumber, email, passwordHash });
    res.status(201).json(sm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/salesmen/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, mobileNumber, email, isActive, password } = req.body;
  
  try {
    const sm = await Salesman.findByPk(id);
    if (!sm) return res.status(404).json({ error: 'Salesman not found' });

    const updates = { name, mobileNumber, email, isActive };
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 12);
    }
    
    await sm.update(updates);
    res.json(sm);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/salesmen/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const sm = await Salesman.findByPk(id);
    if (!sm) return res.status(404).json({ error: 'Salesman not found' });
    
    // Set inactive instead of delete to keep history intact
    await sm.update({ isActive: false });
    res.json({ success: true, message: 'Salesman deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/salesmen/:id/targets', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { targetOrders, targetRevenue, targetDuesCollected } = req.body;

  try {
    const sm = await Salesman.findByPk(id);
    if (!sm) return res.status(404).json({ error: 'Salesman not found' });

    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    let target = await SalesmanTarget.findOne({ where: { salesmanId: id, month: firstDayOfMonth } });
    if (target) {
      await target.update({ targetOrders, targetRevenue, targetDuesCollected });
    } else {
      target = await SalesmanTarget.create({
        salesmanId: id,
        month: firstDayOfMonth,
        targetOrders,
        targetRevenue,
        targetDuesCollected
      });
    }

    res.json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// RETAILER CRUD
app.get('/api/admin/retailers', authenticateAdmin, async (req, res) => {
  try {
    const list = await Retailer.findAll({ include: [Salesman, RetailerAddress] });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/retailers', authenticateAdmin, async (req, res) => {
  const { name, mobileNumber, email, password, category, creditLimit, assignedSalesmanId } = req.body;
  if (!name || !mobileNumber || !email || !password || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const ret = await Retailer.create({
      name, mobileNumber, email, passwordHash, category,
      creditLimit: creditLimit || 0.00,
      assignedSalesmanId: assignedSalesmanId || null,
      creditTermApproved: req.body.creditTermApproved || 'none',
      creditRequestStatus: req.body.creditRequestStatus || 'none'
    });
    res.status(201).json(ret);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/retailers/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, mobileNumber, email, category, creditLimit, assignedSalesmanId, isActive, password, creditTermApproved, creditRequestStatus } = req.body;

  try {
    const ret = await Retailer.findByPk(id);
    if (!ret) return res.status(404).json({ error: 'Retailer not found' });

    const updates = { name, mobileNumber, email, category, creditLimit, assignedSalesmanId, isActive, creditTermApproved, creditRequestStatus };
    if (password) {
      updates.passwordHash = await bcrypt.hash(password, 12);
    }

    await ret.update(updates);
    res.json(ret);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/retailers/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const ret = await Retailer.findByPk(id);
    if (!ret) return res.status(404).json({ error: 'Retailer not found' });
    await ret.update({ isActive: false });
    res.json({ success: true, message: 'Retailer deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/retailers/:id/credit-limit', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { creditLimit } = req.body;

  try {
    const ret = await Retailer.findByPk(id);
    if (!ret) return res.status(404).json({ error: 'Retailer not found' });

    ret.creditLimit = creditLimit;
    await ret.save();
    res.json(ret);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/retailers/:id/review-credit-term
app.post('/api/admin/retailers/:id/review-credit-term', authenticateAdmin, async (req, res) => {
  const { status, approvedTerm } = req.body; // status: 'approved' or 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  try {
    const retailer = await Retailer.findByPk(req.params.id);
    if (!retailer) return res.status(404).json({ error: 'Retailer not found' });
    
    if (status === 'approved') {
      retailer.creditTermApproved = approvedTerm || retailer.creditTermRequest;
      retailer.creditRequestStatus = 'approved';
    } else {
      retailer.creditRequestStatus = 'rejected';
    }
    
    await retailer.save();
    
    addLiveLog('SYSTEM', retailer.name, `Credit request ${status} by admin (Term: ${retailer.creditTermApproved})`);
    
    res.json({ success: true, retailer });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// PRODUCT CRUD (ADMIN)
app.get('/api/admin/products', authenticateAdmin, async (req, res) => {
  try {
    const list = await Product.findAll({ include: [ProductCategory] });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
  const { name, sku, brand, categoryId, description, priceT1, priceT2, priceT3, stockQuantity, lowStockThreshold, images, isFeatured, hsnCode, gstRate } = req.body;

  try {
    const p = await Product.create({
      name, sku, brand, categoryId, description, priceT1, priceT2, priceT3,
      stockQuantity: stockQuantity || 0,
      lowStockThreshold: lowStockThreshold || 5,
      images: images || [],
      isFeatured: !!isFeatured,
      hsnCode, gstRate
    });
    res.status(201).json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, sku, brand, categoryId, description, priceT1, priceT2, priceT3, stockQuantity, lowStockThreshold, images, isFeatured, isActive, hsnCode, gstRate } = req.body;

  try {
    const p = await Product.findByPk(id);
    if (!p) return res.status(404).json({ error: 'Product not found' });

    await p.update({
      name, sku, brand, categoryId, description, priceT1, priceT2, priceT3,
      stockQuantity, lowStockThreshold, images, isFeatured, isActive, hsnCode, gstRate
    });
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/products/:id/stock', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { quantity, reason } = req.body; // e.g. quantity: 10 (add), or -5 (deduct)

  try {
    const p = await Product.findByPk(id);
    if (!p) return res.status(404).json({ error: 'Product not found' });

    p.stockQuantity = Math.max(0, p.stockQuantity + parseInt(quantity));
    await p.save();

    console.log(`[Product Stock Log] Product ID: ${id} | Adjust: ${quantity} | Reason: ${reason || 'Manual Update'}`);
    res.json(p);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/products/:id/toggle-active', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const p = await Product.findByPk(id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    p.isActive = !p.isActive;
    await p.save();
    res.json({ success: true, isActive: p.isActive, message: `Product ${p.isActive ? 'activated' : 'deactivated'}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const p = await Product.findByPk(id);
    if (!p) return res.status(404).json({ error: 'Product not found' });
    await p.destroy();
    res.json({ success: true, message: 'Product permanently deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CATEGORIES CRUD (ADMIN)
app.get('/api/admin/categories', authenticateAdmin, async (req, res) => {
  try {
    const list = await ProductCategory.findAll({
      order: [['sortOrder', 'ASC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/categories', authenticateAdmin, async (req, res) => {
  const { name, imageUrl, sortOrder } = req.body;
  if (!name) return res.status(400).json({ error: 'Category name is required' });

  try {
    const cat = await ProductCategory.create({
      name,
      imageUrl: imageUrl || null,
      sortOrder: sortOrder || 0
    });
    res.status(201).json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/categories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, imageUrl, sortOrder, isActive } = req.body;

  try {
    const cat = await ProductCategory.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });

    await cat.update({ name, imageUrl, sortOrder, isActive });
    res.json(cat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/categories/:id', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const cat = await ProductCategory.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'Category not found' });
    await cat.update({ isActive: false });
    res.json({ success: true, message: 'Category deactivated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ORDERS MANAGEMENT (ADMIN)
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  try {
    const list = await Order.findAll({
      include: [OrderItem, Retailer],
      order: [['placedAt', 'DESC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/orders/:id/status', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // confirmed, packed, shipped, delivered, cancelled

  try {
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const oldStatus = order.status;
    
    // Run status transitions inside transaction
    const t = await sequelize.transaction();
    try {
      order.status = status;

      // Rule: Confirmed status transitions on cod/due_7/due_15/due_30 orders
      if (status === 'confirmed' && oldStatus !== 'confirmed' && oldStatus !== 'delivered' && oldStatus !== 'shipped' && oldStatus !== 'packed') {
        
        // If payment type is due_7, due_15 or due_30, create DuePayment
        if (['due_7', 'due_15', 'due_30'].includes(order.paymentType)) {
          let days = 7;
          if (order.paymentType === 'due_15') days = 15;
          else if (order.paymentType === 'due_30') days = 30;

          const dueDay = new Date();
          dueDay.setDate(dueDay.getDate() + days);

          await DuePayment.create({
            orderId: order.id,
            retailerId: order.retailerId,
            principalAmount: order.totalProductAmount,
            surchargeAmount: order.surchargeAmount,
            totalDue: order.finalAmount,
            dueDate: dueDay,
            paidAmount: 0.00,
            balanceDue: order.finalAmount,
            status: 'active'
          }, { transaction: t });
        }
        
        const days = order.paymentType === 'due_7' ? 7 : (order.paymentType === 'due_15' ? 15 : 30);
        order.dueDate = order.paymentType === 'cod' ? null : new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }

      // Rule: Cancelled status transition (Admin side)
      if (status === 'cancelled' && oldStatus !== 'cancelled') {
        // 1. Refund stock
        const items = await OrderItem.findAll({ where: { orderId: order.id }, transaction: t });
        for (const item of items) {
          const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
          if (product) {
            product.stockQuantity += item.quantity;
            await product.save({ transaction: t });
          }
        }

        // 2. Clear due payment record if it exists
        if (['due_7', 'due_15', 'due_30'].includes(order.paymentType)) {
          const due = await DuePayment.findOne({ where: { orderId: order.id }, transaction: t });
          if (due) {
            due.status = 'paid';
            due.balanceDue = 0.00;
            await due.save({ transaction: t });
          }
        }
      }

      await order.save({ transaction: t });
      
      // Update retailer's outstanding balance
      await syncRetailerOutstanding(order.retailerId, t);
      
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // Trigger Notification
    const retailer = await Retailer.findByPk(order.retailerId);
    const fcmTitle = 'Order Update';
    const fcmBody = `Your order ${order.orderNumber} is now ${status}.`;
    await Notification.create({ recipientRole: 'retailer', recipientId: order.retailerId, title: fcmTitle, body: fcmBody, type: 'order_status_update' });
    addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

    // If order was placed by salesman, notify them as well
    if (order.placedByRole === 'salesman') {
      const sm = await Salesman.findByPk(order.placedById);
      if (sm) {
        await Notification.create({ recipientRole: 'salesman', recipientId: sm.id, title: fcmTitle, body: `Order ${order.orderNumber} for ${retailer.name} is now ${status}.`, type: 'order_status_update' });
        addLiveLog('FCM', sm.name, `[Notification] ${fcmTitle}: Order ${order.orderNumber} for ${retailer.name} is now ${status}.`);
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/orders/:id/approve-credit
app.post('/api/admin/orders/:id/approve-credit', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending_approval') return res.status(400).json({ error: 'Order does not require credit approval' });

    order.status = 'pending';
    order.creditApprovalStatus = 'approved';
    order.creditApprovalNote = note || 'Approved by Admin';
    await order.save();

    // Notify Retailer
    const retailer = await Retailer.findByPk(order.retailerId);
    const fcmTitle = 'Credit Approved';
    const fcmBody = `Your order ${order.orderNumber} has been approved for credit and is now processing.`;
    await Notification.create({ recipientRole: 'retailer', recipientId: order.retailerId, title: fcmTitle, body: fcmBody, type: 'credit_approved' });
    addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

    if (order.placedByRole === 'salesman') {
      const sm = await Salesman.findByPk(order.placedById);
      if (sm) {
        await Notification.create({ recipientRole: 'salesman', recipientId: sm.id, title: fcmTitle, body: `Order ${order.orderNumber} for ${retailer.name} credit approved.`, type: 'credit_approved' });
        addLiveLog('FCM', sm.name, `[Notification] ${fcmTitle}: Order ${order.orderNumber} for ${retailer.name} approved.`);
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/orders/:id/reject-credit
app.post('/api/admin/orders/:id/reject-credit', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;

  try {
    const order = await Order.findByPk(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'pending_approval') return res.status(400).json({ error: 'Order does not require credit approval' });

    // Cancel order and refund stock inside database transaction
    const t = await sequelize.transaction();
    try {
      const items = await OrderItem.findAll({ where: { orderId: id }, transaction: t });
      for (const item of items) {
        const prod = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
        if (prod) {
          prod.stockQuantity += item.quantity;
          await prod.save({ transaction: t });
        }
      }

      order.status = 'cancelled';
      order.creditApprovalStatus = 'rejected';
      order.creditApprovalNote = note || 'Rejected due to credit limits';
      await order.save({ transaction: t });
      await t.commit();
    } catch (err) {
      await t.rollback();
      throw err;
    }

    // Notify Retailer
    const retailer = await Retailer.findByPk(order.retailerId);
    const fcmTitle = 'Credit Rejected';
    const fcmBody = `Your order ${order.orderNumber} was rejected. Reason: ${note || 'Credit limit exceeded'}`;
    await Notification.create({ recipientRole: 'retailer', recipientId: order.retailerId, title: fcmTitle, body: fcmBody, type: 'credit_rejected' });
    addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

    if (order.placedByRole === 'salesman') {
      const sm = await Salesman.findByPk(order.placedById);
      if (sm) {
        await Notification.create({ recipientRole: 'salesman', recipientId: sm.id, title: fcmTitle, body: `Order ${order.orderNumber} for ${retailer.name} credit rejected.`, type: 'credit_rejected' });
        addLiveLog('FCM', sm.name, `[Notification] ${fcmTitle}: Order ${order.orderNumber} for ${retailer.name} rejected.`);
      }
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DUE PAYMENT RECORD (ADMIN)
app.get('/api/admin/dues', authenticateAdmin, async (req, res) => {
  try {
    const list = await DuePayment.findAll({
      include: [Order, Retailer, DuePaymentTransaction],
      order: [['dueDate', 'ASC']]
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/dues/:id/record-payment
app.post('/api/admin/dues/:id/record-payment', authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { amountReceived, note } = req.body;
  
  if (!amountReceived || parseFloat(amountReceived) <= 0) {
    return res.status(400).json({ error: 'Valid amountReceived is required' });
  }

  const amount = parseFloat(amountReceived);

  // Execute payment recording in a database transaction
  const t = await sequelize.transaction();
  try {
    const due = await DuePayment.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!due) {
      await t.rollback();
      return res.status(404).json({ error: 'Due payment record not found' });
    }
    if (due.status === 'paid') {
      await t.rollback();
      return res.status(400).json({ error: 'This due payment is already fully paid' });
    }

    if (amount > parseFloat(due.balanceDue)) {
      await t.rollback();
      return res.status(400).json({ error: `Amount exceeds remaining due balance of ₹${due.balanceDue}` });
    }

    due.paidAmount = parseFloat(due.paidAmount) + amount;
    due.balanceDue = parseFloat(due.balanceDue) - amount;

    if (parseFloat(due.balanceDue) <= 0.05) {
      due.status = 'paid';
      due.balanceDue = 0.00;
    }

    await due.save({ transaction: t });

    // Log transaction
    const transaction = await DuePaymentTransaction.create({
      duePaymentId: due.id,
      amountReceived: amount,
      recordedByAdminId: req.user.id,
      note: note || 'Offline payment recorded'
    }, { transaction: t });

    // Deduct from Retailer's Outstanding Balance using dynamic synchronizer
    const updatedOutstanding = await syncRetailerOutstanding(due.retailerId, t);
    const retailer = await Retailer.findByPk(due.retailerId, { transaction: t });

    await t.commit();

    // Trigger Notification for payment recording
    const fcmTitle = 'Payment Received';
    const fcmBody = `A payment of ₹${amount.toFixed(2)} was received and credited against order due. New outstanding: ₹${retailer.currentOutstanding.toFixed(2)}.`;
    await Notification.create({ recipientRole: 'retailer', recipientId: due.retailerId, title: fcmTitle, body: fcmBody, type: 'order_status_update' });
    addLiveLog('FCM', retailer.name, `[Notification] ${fcmTitle}: ${fcmBody}`);

    // If there is an assigned salesman, notify them too to track target achievements
    if (retailer.assignedSalesmanId) {
      const sm = await Salesman.findByPk(retailer.assignedSalesmanId);
      if (sm) {
        await Notification.create({ recipientRole: 'salesman', recipientId: sm.id, title: fcmTitle, body: `Retailer ${retailer.name} paid ₹${amount.toFixed(2)}.`, type: 'order_status_update' });
        addLiveLog('FCM', sm.name, `[Notification] ${fcmTitle}: Retailer ${retailer.name} paid ₹${amount.toFixed(2)}.`);
      }
    }

    res.json({
      success: true,
      due: due,
      newOutstanding: retailer.currentOutstanding
    });
  } catch (err) {
    await t.rollback();
    res.status(500).json({ error: err.message });
  }
});

// PAYMENT CONFIG MANAGEMENT (ADMIN)
app.get('/api/admin/payment-config', authenticateAdmin, async (req, res) => {
  try {
    const list = await PaymentConfig.findAll();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/payment-config', authenticateAdmin, async (req, res) => {
  const { configs } = req.body; // expects array of config updates: [{ paymentType: 'cod', flatCharge: 60 }]
  if (!configs || !Array.isArray(configs)) return res.status(400).json({ error: 'configs array is required' });

  try {
    for (const item of configs) {
      const cfg = await PaymentConfig.findOne({ where: { paymentType: item.paymentType } });
      if (cfg) {
        await cfg.update({
          flatCharge: item.flatCharge !== undefined ? item.flatCharge : cfg.flatCharge,
          percentageRate: item.percentageRate !== undefined ? item.percentageRate : cfg.percentageRate
        });
      }
    }
    const updated = await PaymentConfig.findAll();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// cron job logic simulated (mark overdue dues)
app.post('/api/admin/cron/check-overdue', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const activeDues = await DuePayment.findAll({
      where: {
        status: 'active',
        dueDate: { [Op.lt]: today }
      },
      include: [Retailer]
    });

    let count = 0;
    for (const due of activeDues) {
      due.status = 'overdue';
      await due.save();
      count++;

      // Notify Retailer
      const fcmTitle = 'Overdue Alert';
      const fcmBody = `Your payment of ₹${due.totalDue} for order due is overdue since ${due.dueDate}.`;
      await Notification.create({ recipientRole: 'retailer', recipientId: due.retailerId, title: fcmTitle, body: fcmBody, type: 'overdue_alert' });
      addLiveLog('FCM', due.Retailer.name, `[ALERT] ${fcmTitle}: ${fcmBody}`);
    }

    res.json({ success: true, count, message: `Processed ${count} overdue records` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/debug-uploads', (req, res) => {
  try {
    const uploadDir = path.join(__dirname, 'uploads');
    if (fs.existsSync(uploadDir)) {
      res.json({
        exists: true,
        path: uploadDir,
        files: fs.readdirSync(uploadDir)
      });
    } else {
      res.json({ exists: false, path: uploadDir });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Server Listen
sequelize.authenticate().then(async () => {
  console.log('Connected to PostgreSQL successfully via Sequelize.');
  // Sync all models (creates/updates tables if they do not exist/are out of sync)
  await sequelize.sync({ alter: true });
  console.log('Database models synced.');
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Unable to connect to database:', err);
});
