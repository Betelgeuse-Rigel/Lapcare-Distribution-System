import React, { useState, useEffect } from 'react';
import { 
  Lock, Phone, Key, ShieldAlert, Award, 
  Plus, Minus, Check, ShoppingBag, Eye, Trash2,
  Calendar, FileText, AlertTriangle, ChevronRight,
  TrendingUp, CircleDollarSign, CheckSquare, PlusCircle,
  MapPin, Edit, RefreshCw, LogOut
} from 'lucide-react';

export default function MobilePortal({ onNotification }) {
  // Mobile Router State
  const [screen, setScreen] = useState('splash'); // splash, login, main
  const [activeTab, setActiveTab] = useState('home'); // home, products, orders, dues, profile (for retailer) or dashboard, retailers, orders, dues, profile (for salesman)
  
  // Auth state
  const [authMethod, setAuthMethod] = useState('password'); // password, otp
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  // Retailer states
  const [retailerDashboard, setRetailerDashboard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dues, setDues] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Address CRUD modal
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false });
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  const [checkoutAddress, setCheckoutAddress] = useState('');
  const [checkoutPayment, setCheckoutPayment] = useState('cod');
  const [paymentConfigs, setPaymentConfigs] = useState([]);

  // Salesman states
  const [salesmanDashboard, setSalesmanDashboard] = useState(null);
  const [assignedRetailers, setAssignedRetailers] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState(null); // Selected for details or order-on-behalf
  const [onBehalfRetailer, setOnBehalfRetailer] = useState(null); // Active context for ordering on behalf

  // Auto transition splash screen
  useEffect(() => {
    if (screen === 'splash') {
      const timer = setTimeout(() => {
        setScreen('login');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [screen]);

  // Fetch initial payment configurations
  const fetchPaymentConfigs = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/payment-config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      // In mobile app, config endpoint is accessed using normal token. Let's make it standard
      // If unauthorized (requires admin token), we fallback to offline calculation helper
      if (res.ok) {
        const data = await res.json();
        setPaymentConfigs(data);
      } else {
        // Fallback standard payment configs
        setPaymentConfigs([
          { paymentType: 'cod', label: 'Cash on Delivery (COD)', flatCharge: 50 },
          { paymentType: 'due_7', label: 'Due 7 Days', percentageRate: 1 },
          { paymentType: 'due_15', label: 'Due 15 Days', percentageRate: 2 }
        ]);
      }
    } catch (err) {
      setPaymentConfigs([
        { paymentType: 'cod', label: 'Cash on Delivery (COD)', flatCharge: 50 },
        { paymentType: 'due_7', label: 'Due 7 Days', percentageRate: 1 },
        { paymentType: 'due_15', label: 'Due 15 Days', percentageRate: 2 }
      ]);
    }
  };

  // Fetch dashboards and data on login
  useEffect(() => {
    if (!token || !user) return;
    
    fetchPaymentConfigs();
    fetchCategories();
    fetchOrders();
    fetchDues();

    if (user.role === 'retailer') {
      fetchRetailerDashboard();
      fetchAddresses();
      fetchProducts();
    } else if (user.role === 'salesman') {
      fetchSalesmanDashboard();
      fetchAssignedRetailers();
    }
  }, [token, user]);

  const fetchRetailerDashboard = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/retailer/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRetailerDashboard(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalesmanDashboard = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/salesman/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesmanDashboard(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAssignedRetailers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/salesman/retailers', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAssignedRetailers(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      // Make it public or auth endpoint
      const res = await fetch('http://localhost:5000/api/products/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async (retId = null) => {
    try {
      const targetRetId = retId || (user.role === 'retailer' ? user.id : onBehalfRetailer?.id);
      if (!targetRetId) return;

      const url = `http://localhost:5000/api/products?retailerId=${targetRetId}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProducts();
    }
  }, [selectedCategory, searchQuery, onBehalfRetailer]);

  const fetchAddresses = async (retId = null) => {
    try {
      const targetRetId = retId || (user.role === 'retailer' ? user.id : onBehalfRetailer?.id);
      if (!targetRetId) return;

      const res = await fetch(`http://localhost:5000/api/retailer/addresses?retailerId=${targetRetId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
        const def = data.find(a => a.isDefault);
        if (def) setCheckoutAddress(def.id);
        else if (data.length > 0) setCheckoutAddress(data[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDues = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/dues', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDues(data);
      }
    } catch (err) {
      console.error(err);
    }
  };


  // ==========================================
  // AUTHENTICATION FLOW METHODS
  // ==========================================
  const handleGetOtp = async () => {
    if (!mobileNumber) {
      onNotification('warning', 'Phone number is required');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        onNotification('success', 'OTP Sent successfully!');
      } else {
        onNotification('error', data.error || 'Failed to send OTP');
      }
    } catch (err) {
      onNotification('error', 'Server connection failed');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      onNotification('warning', 'Please enter the OTP');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, otp: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setScreen('main');
        setActiveTab(data.user.role === 'salesman' ? 'dashboard' : 'home');
        onNotification('success', `Welcome back, ${data.user.name}!`);
      } else {
        onNotification('error', data.error || 'OTP verification failed');
      }
    } catch (err) {
      onNotification('error', 'Server connection failed');
    }
  };

  const handlePasswordLogin = async () => {
    if (!mobileNumber || !password) {
      onNotification('warning', 'Credentials cannot be empty');
      return;
    }
    try {
      const res = await fetch('http://localhost:5000/api/auth/login-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setScreen('main');
        setActiveTab(data.user.role === 'salesman' ? 'dashboard' : 'home');
        onNotification('success', `Welcome, ${data.user.name}!`);
      } else {
        onNotification('error', data.error || 'Invalid credentials');
      }
    } catch (err) {
      onNotification('error', 'Server connection failed');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    setScreen('login');
    setMobileNumber('');
    setPassword('');
    setOtpSent(false);
    setOtpCode('');
    setCart([]);
    setOnBehalfRetailer(null);
    setSelectedRetailer(null);
    onNotification('info', 'Logged out successfully');
  };

  // ==========================================
  // CART & ORDER CHECKOUT FLOWS
  // ==========================================
  const addToCart = (product) => {
    if (product.stockQuantity <= 0) {
      onNotification('error', 'Item is out of stock!');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          onNotification('warning', 'Cannot exceed available stock!');
          return prev;
        }
        return prev.map(item => item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        price: parseFloat(product.price),
        quantity: 1,
        maxStock: product.stockQuantity
      }];
    });
    onNotification('success', `${product.name} added to cart`);
  };

  const updateCartQty = (productId, change) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + change;
        if (newQty <= 0) return null;
        if (newQty > item.maxStock) {
          onNotification('warning', 'Reached stock limit');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean));
  };

  const getCartTotals = () => {
    const productTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const activeConfig = paymentConfigs.find(c => c.paymentType === checkoutPayment);
    let surcharge = 0;
    if (activeConfig) {
      surcharge = checkoutPayment === 'cod' 
        ? parseFloat(activeConfig.flatCharge) 
        : productTotal * (parseFloat(activeConfig.percentageRate) / 100);
    }
    return {
      productTotal,
      surcharge,
      finalTotal: productTotal + surcharge
    };
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (!checkoutAddress) {
      onNotification('warning', 'Please select a delivery address');
      return;
    }

    const { finalTotal } = getCartTotals();
    const activeCredit = user.role === 'retailer' 
      ? retailerDashboard?.retailer?.availableCredit 
      : onBehalfRetailer?.availableCredit;

    try {
      const res = await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          retailerId: user.role === 'salesman' ? onBehalfRetailer?.id : user.id,
          paymentType: checkoutPayment,
          deliveryAddressId: parseInt(checkoutAddress),
          items: cart.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            sku: item.sku
          }))
        })
      });

      const data = await res.json();
      if (res.ok) {
        setCart([]);
        fetchOrders();
        fetchDues();
        
        if (user.role === 'retailer') {
          fetchRetailerDashboard();
        } else {
          fetchSalesmanDashboard();
          fetchAssignedRetailers();
          // Update active onBehalfRetailer credit balance locally
          setOnBehalfRetailer(prev => ({
            ...prev,
            currentOutstanding: prev.currentOutstanding + (checkoutPayment === 'cod' ? 0 : finalTotal),
            availableCredit: Math.max(0, prev.creditLimit - (prev.currentOutstanding + (checkoutPayment === 'cod' ? 0 : finalTotal)))
          }));
        }

        if (data.status === 'pending_approval') {
          onNotification('warning', 'Order placed! Exceeded credit limit, awaiting Admin Approval.');
          setActiveTab('orders');
        } else {
          onNotification('success', `Order ${data.orderNumber} placed successfully!`);
          setActiveTab('orders');
        }
      } else {
        onNotification('error', data.error || 'Checkout failed');
      }
    } catch (err) {
      onNotification('error', 'Connection failed');
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/orders/${orderId}/cancel`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onNotification('success', 'Order cancelled successfully');
        fetchOrders();
        fetchProducts();
        if (user.role === 'retailer') fetchRetailerDashboard();
        else fetchSalesmanDashboard();
      } else {
        const data = await res.json();
        onNotification('error', data.error || 'Cancellation failed');
      }
    } catch (err) {
      onNotification('error', 'Connection error');
    }
  };


  // ==========================================
  // ADDRESS CRUD ACTIONS
  // ==========================================
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    const targetRetId = user.role === 'retailer' ? user.id : onBehalfRetailer?.id;
    if (!targetRetId) return;

    const payload = { ...addressForm, retailerId: targetRetId };
    const method = editingAddressId ? 'PUT' : 'POST';
    const url = editingAddressId 
      ? `http://localhost:5000/api/retailer/addresses/${editingAddressId}` 
      : 'http://localhost:5000/api/retailer/addresses';

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onNotification('success', editingAddressId ? 'Address updated' : 'Address added');
        setAddressModalOpen(false);
        setAddressForm({ label: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false });
        setEditingAddressId(null);
        fetchAddresses(targetRetId);
      }
    } catch (err) {
      onNotification('error', 'Failed to save address');
    }
  };

  const handleEditAddress = (addr) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      label: addr.label,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault
    });
    setAddressModalOpen(true);
  };

  const handleDeleteAddress = async (addrId) => {
    const targetRetId = user.role === 'retailer' ? user.id : onBehalfRetailer?.id;
    try {
      const res = await fetch(`http://localhost:5000/api/retailer/addresses/${addrId}?retailerId=${targetRetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onNotification('success', 'Address deleted');
        fetchAddresses(targetRetId);
      }
    } catch (err) {
      onNotification('error', 'Failed to delete address');
    }
  };


  // ==========================================
  // RETAILER SUB-SCREENS RENDERING
  // ==========================================
  const renderRetailerHome = () => {
    if (!retailerDashboard) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading dashboard...</div>;
    const { retailer, featuredProducts } = retailerDashboard;
    
    const totalOrdersCount = orders.length;
    const activeOrdersCount = orders.filter(o => ['pending', 'pending_approval', 'processing', 'shipped'].includes(o.status)).length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '12px' }}>
        
        {/* Welcome message */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Welcome Back</h4>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{retailer.name}</h3>
          </div>
        </div>

        {/* Account & Order Overview Card */}
        <div className="card" style={{
          background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)',
          color: 'white',
          border: 'none',
          padding: '14px 16px',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Account & Order Overview</h4>
            <span style={{ fontSize: '0.58rem', background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '10px', color: '#fff', fontWeight: 700, letterSpacing: '0.3px' }}>Verified Partner</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div>
              <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 700, color: '#bbdefb', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Total Orders Placed</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>{totalOrdersCount}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'block', fontSize: '0.58rem', fontWeight: 700, color: '#bbdefb', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Active / In-Transit</span>
              <span style={{ fontSize: '1.3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: '#ffffff', lineHeight: 1.1 }}>{activeOrdersCount} Orders</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.6rem', fontWeight: 600, color: '#e3f2fd', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '8px' }}>
            <CheckSquare size={12} color="#90caf9" />
            <span>Priority B2B Dispatch & Order Fulfillment Active</span>
          </div>
        </div>

        {/* Category list */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>Browse Categories</h3>
          <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => { setSelectedCategory(cat.id); setActiveTab('products'); }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
              >
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#fff',
                  border: '1.5px solid var(--border-color)',
                  backgroundImage: `url(${cat.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}></div>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-main)' }}>{cat.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '10px' }}>Featured Hardware</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', width: '100%' }}>
            {featuredProducts.map(prod => (
              <div key={prod.id} className="card" style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, overflow: 'hidden' }}>
                <div style={{
                  height: '75px',
                  borderRadius: '6px',
                  backgroundImage: `url(${prod.images?.[0]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#f1f5f9',
                  position: 'relative',
                  width: '100%'
                }}>
                  {/* Stock status badge */}
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    left: '4px',
                    fontSize: '0.55rem',
                    padding: '2px 4px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    background: prod.stockQuantity === 0 ? 'var(--danger-light)' : (prod.stockQuantity <= prod.lowStockThreshold ? 'var(--warning-light)' : 'var(--success-light)'),
                    color: prod.stockQuantity === 0 ? 'var(--danger)' : (prod.stockQuantity <= prod.lowStockThreshold ? 'var(--warning)' : 'var(--success)'),
                  }}>
                    {prod.stockQuantity === 0 ? 'Out of Stock' : (prod.stockQuantity <= prod.lowStockThreshold ? 'Low Stock' : 'In Stock')}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {prod.name}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--primary)' }}>₹{parseFloat(prod.price).toLocaleString()}</span>
                  <button 
                    onClick={() => addToCart(prod)}
                    className="btn btn-primary" 
                    style={{ padding: '2px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderRetailerProducts = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px' }}>
        
        {/* Search */}
        <input 
          type="text" 
          placeholder="Search products by name/SKU..."
          className="form-control"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {/* Category Filters row */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          <button 
            onClick={() => setSelectedCategory(null)}
            className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px' }}
          >
            All Items
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
              style={{ padding: '4px 12px', fontSize: '0.75rem', borderRadius: '12px', whiteSpace: 'nowrap' }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products Vertical List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>No products found</div>
          ) : (
            products.map(prod => (
              <div key={prod.id} className="card" style={{ display: 'flex', gap: '10px', padding: '8px' }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '6px',
                  backgroundImage: `url(${prod.images?.[0]})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundColor: '#f1f5f9',
                  flexShrink: 0
                }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                  <div>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.name}
                    </h4>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', display: 'block' }}>SKU: {prod.sku}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--primary)' }}>₹{parseFloat(prod.price).toLocaleString()}</span>
                    
                    {/* Stock Status Label & Button */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{
                        fontSize: '0.6rem',
                        padding: '1px 4px',
                        borderRadius: '4px',
                        fontWeight: 'bold',
                        background: prod.stockQuantity === 0 ? 'var(--danger-light)' : (prod.stockQuantity <= prod.lowStockThreshold ? 'var(--warning-light)' : 'var(--success-light)'),
                        color: prod.stockQuantity === 0 ? 'var(--danger)' : (prod.stockQuantity <= prod.lowStockThreshold ? 'var(--warning)' : 'var(--success)'),
                      }}>
                        {prod.stockQuantity === 0 ? 'Out of Stock' : (prod.stockQuantity <= prod.lowStockThreshold ? 'Low Stock' : 'In Stock')}
                      </span>
                      <button
                        onClick={() => addToCart(prod)}
                        disabled={prod.stockQuantity === 0}
                        className="btn btn-primary"
                        style={{ padding: '3px', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderRetailerCart = () => {
    const { productTotal, surcharge, finalTotal } = getCartTotals();
    const activeCredit = user.role === 'retailer' 
      ? retailerDashboard?.retailer?.availableCredit 
      : onBehalfRetailer?.availableCredit;

    const limitExceeded = finalTotal > activeCredit;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '12px', height: '100%' }}>
        {onBehalfRetailer && (
          <div style={{
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            padding: '8px',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            🛒 Ordering for: {onBehalfRetailer.name}
          </div>
        )}

        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-light)' }}>
            <ShoppingBag size={48} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.5 }} />
            Your cart is empty. Add products first!
          </div>
        ) : (
          <>
            {/* Cart Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {cart.map(item => (
                <div key={item.productId} className="card" style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>₹{item.price.toLocaleString()} x {item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => updateCartQty(item.productId, -1)}
                      style={{ border: '1px solid var(--border-color)', background: 'white', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQty(item.productId, 1)}
                      style={{ border: '1px solid var(--border-color)', background: 'white', padding: '4px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery address select */}
            <div className="form-group">
              <label>Delivery Address</label>
              <select 
                className="form-control"
                value={checkoutAddress}
                onChange={(e) => setCheckoutAddress(e.target.value)}
              >
                <option value="">Select Address...</option>
                {addresses.map(addr => (
                  <option key={addr.id} value={addr.id}>{addr.label} - {addr.addressLine1}, {addr.city}</option>
                ))}
              </select>
            </div>

            {/* Payment type select */}
            <div className="form-group">
              <label>Payment Arrangement</label>
              <select 
                className="form-control"
                value={checkoutPayment}
                onChange={(e) => setCheckoutPayment(e.target.value)}
              >
                <option value="cod">Cash on Delivery (COD)</option>
                <option value="due_7">Due 7 Days</option>
                <option value="due_15">Due 15 Days</option>
              </select>
            </div>

            {/* Warnings */}
            {limitExceeded && (
              <div style={{
                background: '#fff3e0',
                borderLeft: '4px solid #ef6c00',
                padding: '10px',
                borderRadius: '4px',
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}>
                <AlertTriangle size={18} color="#ef6c00" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: '0.65rem', color: '#e65100', lineHeight: 1.3 }}>
                  <strong>Order Notice:</strong> {user?.role === 'retailer' ? 'Order requires standard distributor approval. It will be placed in Pending Approval status.' : `Order amount (₹${finalTotal.toLocaleString()}) exceeds available credit (₹${activeCredit?.toLocaleString() || 0}). Order will go into Pending Approval.`}
                </div>
              </div>
            )}

            {/* Totals Summary */}
            <div className="card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px', background: '#f8fafc' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Subtotal:</span>
                <span>₹{productTotal.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                <span>Surcharge ({checkoutPayment === 'cod' ? 'Flat fee' : 'Interest rate'}):</span>
                <span>₹{surcharge.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 'bold', borderTop: '1px solid #e2e8f0', paddingTop: '6px' }}>
                <span>Total Amount:</span>
                <span style={{ color: 'var(--primary)' }}>₹{finalTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Place order button */}
            <button 
              onClick={handleCheckout}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <CheckSquare size={16} />
              <span>Confirm & Place Order</span>
            </button>
          </>
        )}
      </div>
    );
  };

  const renderRetailerOrders = () => {
    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>My Orders</h3>
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)', fontSize: '0.8rem' }}>No orders placed yet</div>
        ) : (
          orders.map(order => {
            const isSelected = selectedOrder?.id === order.id;
            return (
              <div key={order.id} className="card" style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)' }}>{order.orderNumber}</span>
                  <span style={{
                    fontSize: '0.6rem',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    background: order.status === 'delivered' ? 'var(--success-light)' : (order.status === 'cancelled' ? 'var(--danger-light)' : 'var(--warning-light)'),
                    color: order.status === 'delivered' ? 'var(--success)' : (order.status === 'cancelled' ? 'var(--danger)' : 'var(--warning)')
                  }}>
                    {order.status}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-light)' }}>
                  <span>Placed: {new Date(order.placedAt).toLocaleDateString()}</span>
                  <span style={{ fontWeight: 'bold', color: 'var(--text-main)' }}>₹{parseFloat(order.finalAmount).toLocaleString()}</span>
                </div>

                {/* Show cancel button if pending */}
                {['pending', 'pending_approval'].includes(order.status) && (
                  <button 
                    onClick={() => handleCancelOrder(order.id)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.65rem', padding: '4px 8px', alignSelf: 'flex-end', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--danger)' }}
                  >
                    <Trash2 size={12} />
                    <span>Cancel Order</span>
                  </button>
                )}

                {/* Expand view details */}
                <button
                  onClick={() => setSelectedOrder(isSelected ? null : order)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.65rem', alignSelf: 'flex-start', padding: '2px 0' }}
                >
                  {isSelected ? 'Hide Details' : 'View Details'}
                </button>

                {isSelected && (
                  <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.65rem' }}>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <strong>Shipping Address:</strong> {order.deliveryAddressSnapshot?.addressLine1}, {order.deliveryAddressSnapshot?.city}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      <strong>Payment arrangement:</strong> {order.paymentType.toUpperCase()}
                    </div>
                    {order.creditApprovalStatus !== 'not_required' && (
                      <div style={{ color: 'var(--text-muted)' }}>
                        <strong>Credit Status:</strong> {order.creditApprovalStatus.toUpperCase()} ({order.creditApprovalNote || 'No details'})
                      </div>
                    )}
                    <div style={{ fontWeight: 'bold', marginTop: '4px' }}>Items:</div>
                    {order.OrderItems?.map(item => (
                      <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                        <span>{item.productName} (x{item.quantity})</span>
                        <span>₹{parseFloat(item.subtotal).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderRetailerDues = () => {
    const outstandingList = dues.filter(d => d.status !== 'paid');
    const totalOutstanding = outstandingList.reduce((sum, d) => sum + parseFloat(d.balanceDue), 0);

    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        {/* Outstanding dues card summary */}
        <div className="card" style={{ background: '#f8fafc', padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', display: 'block', textTransform: 'uppercase' }}>Total Outstanding Ledger</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)', fontFamily: 'var(--font-display)' }}>₹{totalOutstanding.toLocaleString()}</span>
          </div>
          <span className="badge badge-danger">{outstandingList.length} Active Bills</span>
        </div>

        {/* Ledger Dues List */}
        <div>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '8px' }}>Aging Dues</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {dues.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)', fontSize: '0.8rem' }}>No dues recorded</div>
            ) : (
              dues.map(due => (
                <div key={due.id} className="card" style={{ padding: '10px', borderLeft: `4px solid ${due.status === 'overdue' ? 'var(--danger)' : (due.status === 'paid' ? 'var(--success)' : 'var(--warning)')}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>Bill ID: DP-00{due.id}</span>
                    <span className={`badge ${due.status === 'paid' ? 'badge-success' : (due.status === 'overdue' ? 'badge-danger' : 'badge-warning')}`}>
                      {due.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    <span>Due Date: {new Date(due.dueDate).toLocaleDateString()}</span>
                    <span>Order: {due.Order?.orderNumber}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, borderTop: '1px solid #f1f5f9', paddingTop: '4px', marginTop: '4px' }}>
                    <span>Balance: ₹{parseFloat(due.balanceDue).toLocaleString()}</span>
                    <span style={{ color: 'var(--text-light)', fontWeight: 500 }}>Total: ₹{parseFloat(due.totalDue).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderRetailerProfile = () => {
    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Profile Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#fff' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{user.name}</h3>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📧 {user.email}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📱 {user.mobileNumber}</div>
        </div>

        {/* Addresses book CRUD */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase' }}>Address Book</h4>
            <button 
              onClick={() => {
                setEditingAddressId(null);
                setAddressForm({ label: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', isDefault: false });
                setAddressModalOpen(true);
              }}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '0.7rem', fontWeight: 'bold' }}
            >
              <PlusCircle size={14} /> Add Address
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {addresses.map(addr => (
              <div key={addr.id} className="card" style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.75rem' }}>{addr.label}</strong>
                    {addr.isDefault && <span className="badge badge-success" style={{ fontSize: '0.5rem', padding: '1px 4px' }}>Default</span>}
                  </div>
                  <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {addr.addressLine1}, {addr.addressLine2 ? `${addr.addressLine2}, ` : ''}{addr.city}, {addr.state} - {addr.pincode}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button 
                    onClick={() => handleEditAddress(addr)}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteAddress(addr.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address modal form */}
        {addressModalOpen && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px'
          }}>
            <form 
              onSubmit={handleSaveAddress}
              className="card" 
              style={{ width: '100%', maxWidth: '320px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{editingAddressId ? 'Edit Address' : 'Add New Address'}</h3>
              
              <div className="form-group">
                <label>Address Label</label>
                <input 
                  type="text" 
                  placeholder="e.g. Shop, Warehouse" 
                  className="form-control" 
                  required
                  value={addressForm.label}
                  onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address Line 1 Label</label>
                <input 
                  type="text" 
                  placeholder="Street details" 
                  className="form-control" 
                  required
                  value={addressForm.addressLine1}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine1: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Address Line 2 (Optional)</label>
                <input 
                  type="text" 
                  placeholder="Locality" 
                  className="form-control" 
                  value={addressForm.addressLine2}
                  onChange={(e) => setAddressForm({ ...addressForm, addressLine2: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="form-group">
                  <label>City</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Pincode</label>
                <input 
                  type="text" 
                  className="form-control" 
                  required
                  value={addressForm.pincode}
                  onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="checkbox" 
                  id="defaultCheck"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                />
                <label htmlFor="defaultCheck" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Set as default address</label>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setAddressModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  };


  // ==========================================
  // SALESMAN SUB-SCREENS RENDERING
  // ==========================================
  const renderSalesmanDashboard = () => {
    if (!salesmanDashboard) return <div style={{ padding: '20px', textAlign: 'center' }}>Loading dashboard...</div>;
    const { targets, actual } = salesmanDashboard;

    // Helper progress calculate
    const getProgressInfo = (act, trg) => {
      const pct = trg > 0 ? (act / trg) * 100 : 100;
      let color = '#2e7d32'; // green
      if (pct < 50) color = '#d32f2f'; // red
      else if (pct < 85) color = '#ef6c00'; // amber
      return { pct, color };
    };

    const orderProgress = getProgressInfo(actual.orders, targets.orders);
    const revProgress = getProgressInfo(actual.revenue, targets.revenue);
    const dueProgress = getProgressInfo(actual.dues, targets.dues);

    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        
        {/* Salesman Welcome */}
        <div>
          <h4 style={{ fontSize: '0.8rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>Performance Track</h4>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.name}</h3>
        </div>

        {/* Target Achievements card list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* Target 1: Orders */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBag size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Monthly Orders Target</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: orderProgress.color }}>
                {actual.orders} / {targets.orders}
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, orderProgress.pct)}%`, backgroundColor: orderProgress.color }}></div>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>Achievement: {orderProgress.pct.toFixed(0)}%</span>
          </div>

          {/* Target 2: Revenue */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Monthly Revenue Target</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: revProgress.color }}>
                ₹{actual.revenue.toLocaleString()} / ₹{targets.revenue.toLocaleString()}
              </span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, revProgress.pct)}%`, backgroundColor: revProgress.color }}></div>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>Achievement: {revProgress.pct.toFixed(0)}%</span>
          </div>

          {/* Target 3: Dues Collected */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CircleDollarSign size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Dues Collected Target</span>
              </div>
              <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: dueProgress.color }}>
                ₹{actual.dues.toLocaleString()} / ₹{targets.dues.toLocaleString()}
              </span>
            </div>
            <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, dueProgress.pct)}%`, backgroundColor: dueProgress.color }}></div>
            </div>
            <span style={{ fontSize: '0.6rem', color: 'var(--text-light)' }}>Achievement: {dueProgress.pct.toFixed(0)}%</span>
          </div>

        </div>
      </div>
    );
  };

  const renderSalesmanRetailers = () => {
    if (selectedRetailer) {
      return (
        <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <button 
            onClick={() => setSelectedRetailer(null)}
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '0.7rem', alignSelf: 'flex-start' }}
          >
            ← Back to List
          </button>

          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{selectedRetailer.retailer?.name}</h3>
              <span className="badge badge-info">{selectedRetailer.retailer?.category}</span>
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📱 {selectedRetailer.retailer?.mobileNumber}</span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>📧 {selectedRetailer.retailer?.email}</span>
            
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '6px', fontSize: '0.7rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.6rem' }}>CREDIT LIMIT</span>
                <strong>₹{parseFloat(selectedRetailer.retailer?.creditLimit).toLocaleString()}</strong>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.6rem' }}>OUTSTANDING</span>
                <strong style={{ color: 'var(--danger)' }}>₹{parseFloat(selectedRetailer.retailer?.currentOutstanding).toLocaleString()}</strong>
              </div>
            </div>

            <button 
              onClick={() => {
                setOnBehalfRetailer(selectedRetailer.retailer);
                fetchAddresses(selectedRetailer.retailer.id);
                fetchProducts(selectedRetailer.retailer.id);
                setCart([]);
                setActiveTab('products');
                setSelectedRetailer(null);
              }}
              className="btn btn-primary"
              style={{ marginTop: '10px', fontSize: '0.8rem', padding: '8px' }}
            >
              🛒 Place Order on Behalf
            </button>
          </div>

          {/* Recent Orders */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', marginBottom: '6px' }}>Recent Orders</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {selectedRetailer.recentOrders?.map(order => (
                <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', borderBottom: '1px solid var(--border-color)', fontSize: '0.7rem' }}>
                  <span>{order.orderNumber}</span>
                  <span style={{ fontWeight: 'bold' }}>₹{parseFloat(order.finalAmount).toLocaleString()}</span>
                  <span style={{ color: 'var(--primary)' }}>{order.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 600, borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>My Assigned Retailers</h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {assignedRetailers.map(r => (
            <div 
              key={r.id} 
              className="card" 
              style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
              onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:5000/api/salesman/retailers/${r.id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setSelectedRetailer(data);
                  }
                } catch (err) {
                  onNotification('error', 'Failed to fetch details');
                }
              }}
            >
              <div>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{r.name}</h4>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>Limit: ₹{parseFloat(r.creditLimit).toLocaleString()}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--danger)' }}>₹{parseFloat(r.currentOutstanding).toLocaleString()}</span>
                <span style={{ fontSize: '0.55rem', color: 'var(--text-light)' }}>Outstanding</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };


  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  const renderLogin = () => {
    return (
      <div style={{
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        background: '#fff'
      }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: 'var(--primary)',
            color: 'white',
            fontSize: '2rem',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 8px 16px rgba(13, 71, 161, 0.2)'
          }}>
            B
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>BISWAS DISTRIBUTION</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>B2B DISTRIBUTOR ORDERING PLATFORM</p>
        </div>

        {/* Auth method tab toggler */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-main)',
          padding: '4px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <button
            onClick={() => { setAuthMethod('password'); setOtpSent(false); }}
            className={`btn ${authMethod === 'password' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, border: 'none', padding: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
          >
            Password Log
          </button>
          <button
            onClick={() => setAuthMethod('otp')}
            className={`btn ${authMethod === 'otp' ? 'btn-primary' : 'btn-outline'}`}
            style={{ flex: 1, border: 'none', padding: '6px', fontSize: '0.75rem', borderRadius: '6px' }}
          >
            OTP Verification
          </button>
        </div>

        {/* Form fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          <div className="form-group">
            <label>Registered Mobile Number</label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} color="var(--text-light)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                className="form-control"
                style={{ paddingLeft: '32px' }}
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
              />
            </div>
          </div>

          {authMethod === 'password' ? (
            <div className="form-group">
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-light)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="password"
                  placeholder="Enter secret password"
                  className="form-control"
                  style={{ paddingLeft: '32px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          ) : (
            otpSent && (
              <div className="form-group animate-slide-in">
                <label>Verification OTP Code</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} color="var(--text-light)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Enter 6-digit SMS OTP"
                    className="form-control"
                    style={{ paddingLeft: '32px' }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                  />
                </div>
              </div>
            )
          )}

          {/* Submit buttons */}
          {authMethod === 'password' ? (
            <button 
              onClick={handlePasswordLogin}
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: '600' }}
            >
              Access Portal
            </button>
          ) : (
            !otpSent ? (
              <button 
                onClick={handleGetOtp}
                className="btn btn-primary"
                style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: '600' }}
              >
                Request OTP Code
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button 
                  onClick={handleVerifyOtp}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: '600' }}
                >
                  Verify & Log In
                </button>
                <button 
                  onClick={handleGetOtp}
                  className="btn btn-outline"
                  style={{ width: '100%', padding: '8px', fontSize: '0.75rem', borderRadius: '6px' }}
                >
                  Resend Code
                </button>
              </div>
            )
          )}
        </div>

        {/* Demo Helper box */}
        <div style={{
          marginTop: '20px',
          background: '#f8fafc',
          border: '1px dashed #cbd5e1',
          padding: '10px',
          borderRadius: '6px',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          lineHeight: 1.4
        }}>
          <strong>Demo logins (Password: password123):</strong>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', marginTop: '4px' }}>
            <span>Retailer A (T1):</span> <strong>9000000001</strong>
            <span>Retailer B (T2):</span> <strong>9000000002</strong>
            <span>Salesman 1:</span> <strong>9000000010</strong>
          </div>
        </div>
      </div>
    );
  };

  // Main wrapper render logic
  if (screen === 'splash') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #0d47a1 0%, #0a2540 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <div className="animate-pulse-slow" style={{
          width: '80px',
          height: '80px',
          borderRadius: '24px',
          backgroundColor: 'white',
          color: 'var(--primary)',
          fontSize: '2.5rem',
          fontWeight: 900,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
        }}>
          B
        </div>
        <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800, letterSpacing: '0.5px' }}>BISWAS DISTRIBUTION</h2>
        <p style={{ color: '#e3f2fd', fontSize: '0.75rem', marginTop: '4px', opacity: 0.8 }}>Hardware B2B Supply Chain</p>
      </div>
    );
  }

  if (screen === 'login') {
    return renderLogin();
  }

  // Determine active title of active tab
  const getHeaderTitle = () => {
    if (onBehalfRetailer) return `Ordering: ${onBehalfRetailer.name}`;
    
    switch (activeTab) {
      case 'home': return 'Biswas Distribution';
      case 'dashboard': return 'Salesman Performance';
      case 'products': return 'Product Catalog';
      case 'retailers': return 'Retailers Ledger';
      case 'orders': return 'Orders Timeline';
      case 'dues': return 'Account Receivables';
      case 'profile': return 'My Account';
      default: return 'B2B Distributor';
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      
      {/* Device wrapper component */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Navigation title bar inside device frame */}
        <div style={{
          background: 'var(--primary)',
          color: 'white',
          padding: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onBehalfRetailer && (
              <button 
                onClick={() => {
                  setOnBehalfRetailer(null);
                  setCart([]);
                  setActiveTab('retailers');
                }}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                ←
              </button>
            )}
            <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{getHeaderTitle()}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Show cart badge for active retailer/on behalf retailer */}
            {((user?.role === 'retailer') || onBehalfRetailer) && (
              <button 
                onClick={() => setActiveTab('cart')}
                style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}
              >
                🛒
                {cart.length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-5px', right: '-8px',
                    background: 'var(--danger)', color: 'white',
                    fontSize: '0.55rem', borderRadius: '50%', padding: '1px 4px',
                    fontWeight: 'bold'
                  }}>
                    {cart.length}
                  </span>
                )}
              </button>
            )}

            <button 
              onClick={handleLogout}
              style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer', 
                opacity: 0.9,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                fontWeight: '600'
              }}
              title="Logout"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Content body based on active tabs */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {user.role === 'retailer' ? (
            <>
              {activeTab === 'home' && renderRetailerHome()}
              {activeTab === 'products' && renderRetailerProducts()}
              {activeTab === 'cart' && renderRetailerCart()}
              {activeTab === 'orders' && renderRetailerOrders()}
              {activeTab === 'dues' && renderRetailerDues()}
              {activeTab === 'profile' && renderRetailerProfile()}
            </>
          ) : (
            <>
              {activeTab === 'dashboard' && renderSalesmanDashboard()}
              {activeTab === 'retailers' && renderSalesmanRetailers()}
              {activeTab === 'products' && renderRetailerProducts()}
              {activeTab === 'cart' && renderRetailerCart()}
              {activeTab === 'orders' && renderRetailerOrders()}
              {activeTab === 'dues' && renderRetailerDues()}
              {activeTab === 'profile' && renderRetailerProfile()}
            </>
          )}
        </div>

        {/* Navigation bottom bar inside frame */}
        <div style={{
          background: 'white',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '6px 0'
        }}>
          {user.role === 'retailer' ? (
            <>
              <button onClick={() => setActiveTab('home')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'home' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'home' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                🏠 <span>Home</span>
              </button>
              <button onClick={() => setActiveTab('products')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'products' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                📦 <span>Catalog</span>
              </button>
              <button onClick={() => setActiveTab('orders')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                📋 <span>Orders</span>
              </button>
              <button onClick={() => setActiveTab('dues')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'dues' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'dues' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                💰 <span>Dues</span>
              </button>
              <button onClick={() => setActiveTab('profile')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                👤 <span>Profile</span>
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setActiveTab('dashboard')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                📈 <span>Dashboard</span>
              </button>
              <button onClick={() => setActiveTab('retailers')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'retailers' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'retailers' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                👥 <span>Retailers</span>
              </button>
              <button onClick={() => setActiveTab('orders')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                📋 <span>Orders</span>
              </button>
              <button onClick={() => setActiveTab('dues')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'dues' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'dues' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                💰 <span>Dues</span>
              </button>
              <button onClick={() => setActiveTab('profile')} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                👤 <span>Profile</span>
              </button>
            </>
          )}
        </div>

      </div>

    </div>
  );
}
