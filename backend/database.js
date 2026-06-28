const { Sequelize, DataTypes } = require('sequelize');

// Initialize database connection
const sequelize = new Sequelize(
  process.env.DB_NAME || 'b2b_distributor',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password123',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5435', 10),
    dialect: 'postgres',
    logging: false, // Set to console.log to see SQL queries
    define: {
      timestamps: true, // adds createdAt and updatedAt fields
      underscored: true, // converts camelCase to snake_case
    }
  }
);

// Admin Users model
const AdminUser = sequelize.define('AdminUser', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: { type: DataTypes.ENUM('super_admin'), defaultValue: 'super_admin' },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Salesmen model
const Salesman = sequelize.define('Salesman', {
  name: { type: DataTypes.STRING, allowNull: false },
  mobileNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  otp: { type: DataTypes.STRING, allowNull: true },
  otpExpiresAt: { type: DataTypes.DATE, allowNull: true },
  fcmToken: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Salesman Targets model
const SalesmanTarget = sequelize.define('SalesmanTarget', {
  month: { type: DataTypes.DATE, allowNull: false }, // Month represented as first day of month (YYYY-MM-01)
  targetOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
  targetRevenue: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  targetDuesCollected: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 }
});

// Retailers model
const Retailer = sequelize.define('Retailer', {
  name: { type: DataTypes.STRING, allowNull: false },
  mobileNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  otp: { type: DataTypes.STRING, allowNull: true },
  otpExpiresAt: { type: DataTypes.DATE, allowNull: true },
  category: { type: DataTypes.ENUM('T1', 'T2', 'T3'), defaultValue: 'T1' },
  creditLimit: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  currentOutstanding: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  fcmToken: { type: DataTypes.STRING, allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

// Retailer Addresses model
const RetailerAddress = sequelize.define('RetailerAddress', {
  label: { type: DataTypes.STRING, allowNull: false }, // e.g. "Main Shop", "Warehouse"
  addressLine1: { type: DataTypes.STRING, allowNull: false },
  addressLine2: { type: DataTypes.STRING, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: false },
  state: { type: DataTypes.STRING, allowNull: false },
  pincode: { type: DataTypes.STRING, allowNull: false },
  isDefault: { type: DataTypes.BOOLEAN, defaultValue: false }
});

// Product Categories model
const ProductCategory = sequelize.define('ProductCategory', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  imageUrl: { type: DataTypes.STRING, allowNull: true },
  sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  timestamps: false
});

// Products model
const Product = sequelize.define('Product', {
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING, allowNull: false, unique: true },
  brand: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  priceT1: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  priceT2: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  priceT3: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  stockQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  lowStockThreshold: { type: DataTypes.INTEGER, defaultValue: 5 },
  images: { type: DataTypes.JSON, allowNull: true }, // JSON array of S3 URLs
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
  hsnCode: { type: DataTypes.STRING, allowNull: true },
  gstRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true } // e.g. 18.00
});

// Orders model
const Order = sequelize.define('Order', {
  placedByRole: { type: DataTypes.ENUM('retailer', 'salesman'), allowNull: false },
  placedById: { type: DataTypes.INTEGER, allowNull: false }, // retailer.id or salesman.id
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  deliveryAddressSnapshot: { type: DataTypes.JSON, allowNull: false },
  totalProductAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  paymentType: { type: DataTypes.ENUM('cod', 'due_7', 'due_15'), allowNull: false },
  surchargeAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  finalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { 
    type: DataTypes.ENUM('pending', 'pending_approval', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'),
    defaultValue: 'pending'
  },
  creditApprovalStatus: { 
    type: DataTypes.ENUM('not_required', 'pending', 'approved', 'rejected'),
    defaultValue: 'not_required'
  },
  creditApprovalNote: { type: DataTypes.TEXT, allowNull: true },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true },
  isOverdue: { type: DataTypes.BOOLEAN, defaultValue: false },
  warehouseId: { type: DataTypes.INTEGER, allowNull: true }
}, {
  timestamps: true,
  createdAt: 'placedAt',
  updatedAt: 'updatedAt'
});

// Order Items model
const OrderItem = sequelize.define('OrderItem', {
  productName: { type: DataTypes.STRING, allowNull: false }, // Snapshot
  sku: { type: DataTypes.STRING, allowNull: false },         // Snapshot
  unitPrice: { type: DataTypes.DECIMAL(12, 2), allowNull: false }, // Snapshot
  quantity: { type: DataTypes.INTEGER, allowNull: false },
  subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false }
}, {
  timestamps: false
});

// Due Payments model
const DuePayment = sequelize.define('DuePayment', {
  principalAmount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  surchargeAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  totalDue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  dueDate: { type: DataTypes.DATEONLY, allowNull: false },
  paidAmount: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0.00 },
  balanceDue: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  status: { type: DataTypes.ENUM('active', 'overdue', 'paid'), defaultValue: 'active' }
});

// Due Payment Transactions model
const DuePaymentTransaction = sequelize.define('DuePaymentTransaction', {
  amountReceived: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  note: { type: DataTypes.TEXT, allowNull: true },
  recordedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Payment Configs model
const PaymentConfig = sequelize.define('PaymentConfig', {
  paymentType: { type: DataTypes.STRING, allowNull: false, unique: true }, // e.g. "cod", "due_7", "due_15"
  label: { type: DataTypes.STRING, allowNull: false }, // e.g. "Cash on Delivery", "Due 7 Days"
  flatCharge: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  percentageRate: { type: DataTypes.DECIMAL(5, 2), allowNull: true }
});

// Notifications model
const Notification = sequelize.define('Notification', {
  recipientRole: { type: DataTypes.ENUM('retailer', 'salesman'), allowNull: false },
  recipientId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING, allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  type: { 
    type: DataTypes.ENUM(
      'order_placed', 'order_confirmed', 'order_status_update', 
      'due_reminder', 'overdue_alert', 'credit_approval_required', 
      'credit_approved', 'credit_rejected'
    ), 
    allowNull: false 
  },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  sentAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  timestamps: false
});

// Setup Relationships

// Salesman <-> Targets
Salesman.hasMany(SalesmanTarget, { foreignKey: 'salesmanId', onDelete: 'CASCADE' });
SalesmanTarget.belongsTo(Salesman, { foreignKey: 'salesmanId' });

// Salesman <-> Retailer
Salesman.hasMany(Retailer, { foreignKey: 'assignedSalesmanId', onDelete: 'SET NULL' });
Retailer.belongsTo(Salesman, { foreignKey: 'assignedSalesmanId' });

// Retailer <-> Addresses
Retailer.hasMany(RetailerAddress, { foreignKey: 'retailerId', onDelete: 'CASCADE' });
RetailerAddress.belongsTo(Retailer, { foreignKey: 'retailerId' });

// ProductCategory <-> Product
ProductCategory.hasMany(Product, { foreignKey: 'categoryId', onDelete: 'RESTRICT' });
Product.belongsTo(ProductCategory, { foreignKey: 'categoryId' });

// Retailer <-> Order
Retailer.hasMany(Order, { foreignKey: 'retailerId', onDelete: 'RESTRICT' });
Order.belongsTo(Retailer, { foreignKey: 'retailerId' });

// Order <-> OrderItem
Order.hasMany(OrderItem, { foreignKey: 'orderId', onDelete: 'CASCADE' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });

// Product <-> OrderItem
Product.hasMany(OrderItem, { foreignKey: 'productId', onDelete: 'RESTRICT' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Order <-> DuePayment
Order.hasOne(DuePayment, { foreignKey: 'orderId', onDelete: 'RESTRICT' });
DuePayment.belongsTo(Order, { foreignKey: 'orderId' });

// Retailer <-> DuePayment
Retailer.hasMany(DuePayment, { foreignKey: 'retailerId', onDelete: 'RESTRICT' });
DuePayment.belongsTo(Retailer, { foreignKey: 'retailerId' });

// DuePayment <-> DuePaymentTransaction
DuePayment.hasMany(DuePaymentTransaction, { foreignKey: 'duePaymentId', onDelete: 'CASCADE' });
DuePaymentTransaction.belongsTo(DuePayment, { foreignKey: 'duePaymentId' });

// AdminUser <-> DuePaymentTransaction
AdminUser.hasMany(DuePaymentTransaction, { foreignKey: 'recordedByAdminId', onDelete: 'RESTRICT' });
DuePaymentTransaction.belongsTo(AdminUser, { foreignKey: 'recordedByAdminId' });

module.exports = {
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
};
