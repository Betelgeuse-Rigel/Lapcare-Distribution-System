import React, { useState, useEffect } from 'react';
import { API_BASE, resolveImageUrl } from '../config';
import { 
  Lock, Phone, Key, ShieldAlert, Award, 
  Plus, Minus, Check, ShoppingBag, Eye, EyeOff, Trash2,
  Calendar, FileText, AlertTriangle, ChevronRight,
  TrendingUp, CircleDollarSign, CheckSquare, PlusCircle,
  MapPin, Edit, RefreshCw, LogOut, Settings
} from 'lucide-react';

export default function MobilePortal({ onNotification: parentOnNotification }) {
  // Mobile Router State
  const [screen, setScreen] = useState('splash'); // splash, login, main
  const [localToasts, setLocalToasts] = useState([]);
  const [serverUrl, setServerUrl] = useState(() => localStorage.getItem('API_BASE_MOBILE') || API_BASE);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [tempServerUrl, setTempServerUrl] = useState(serverUrl);

  // Local toast handler to render notifications directly within the app viewport
  const onNotification = (type, message) => {
    if (parentOnNotification) {
      parentOnNotification(type, message);
    }
    const id = Date.now() + Math.random().toString(36).substr(2, 5);
    setLocalToasts(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setLocalToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const [activeTab, setActiveTab] = useState('home'); // home, products, orders, dues, profile (for retailer) or dashboard, retailers, orders, dues, profile (for salesman)
  
  // Auth state
  const [authMethod, setAuthMethod] = useState('password'); // password, otp
  const [mobileNumber, setMobileNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  
  // Register fields
  const [authView, setAuthView] = useState('login'); // login, register
  const [registerName, setRegisterName] = useState('');
  const [registerMobile, setRegisterMobile] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  // Retailer states
  const [retailerDashboard, setRetailerDashboard] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null); // For product details modal
  const [qrCodePaymentOrder, setQrCodePaymentOrder] = useState(null); // For dynamic QR code payments
  const [salesmanCheckoutOtpModal, setSalesmanCheckoutOtpModal] = useState(null); // For salesperson checkout OTP verification
  const [searchQuery, setSearchQuery] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dues, setDues] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Product reviews and submission states
  const [productReviews, setProductReviews] = useState([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  // Navigation back-stack history
  const [navHistory, setNavHistory] = useState([]);

  const pushHistory = () => {
    setNavHistory(prev => {
      const last = prev[prev.length - 1];
      if (last && 
          last.screen === screen && 
          last.activeTab === activeTab && 
          last.selectedOrder?.id === selectedOrder?.id && 
          last.selectedProduct?.id === selectedProduct?.id && 
          last.selectedRetailer?.id === selectedRetailer?.id && 
          last.onBehalfRetailer?.id === onBehalfRetailer?.id) {
        return prev;
      }
      return [...prev, {
        screen,
        activeTab,
        selectedOrder: selectedOrder ? { ...selectedOrder } : null,
        selectedProduct: selectedProduct ? { ...selectedProduct } : null,
        selectedRetailer: selectedRetailer ? { ...selectedRetailer } : null,
        onBehalfRetailer: onBehalfRetailer ? { ...onBehalfRetailer } : null
      }];
    });
  };

  const goBack = () => {
    if (navHistory.length === 0) {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
        window.Capacitor.Plugins.App.exitApp();
      }
      return;
    }
    const prevHistory = [...navHistory];
    const prevState = prevHistory.pop();
    setNavHistory(prevHistory);
    if (prevState) {
      setScreen(prevState.screen);
      setActiveTab(prevState.activeTab);
      setSelectedOrder(prevState.selectedOrder);
      setSelectedProduct(prevState.selectedProduct);
      setSelectedRetailer(prevState.selectedRetailer);
      setOnBehalfRetailer(prevState.onBehalfRetailer);
    }
  };

  // Capacitor hardware back button handler
  useEffect(() => {
    if (typeof window !== 'undefined' && window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App) {
      const backListener = window.Capacitor.Plugins.App.addListener('backButton', () => {
        goBack();
      });
      return () => {
        backListener.then(handler => handler.remove());
      };
    }
  }, [navHistory, screen, activeTab, selectedOrder, selectedProduct, selectedRetailer, onBehalfRetailer]);

  // Swipe to go back gesture detection
  useEffect(() => {
    let startX = 0;
    let startY = 0;
    
    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
      }
    };
    
    const handleTouchEnd = (e) => {
      if (e.changedTouches.length === 1) {
        const deltaX = e.changedTouches[0].clientX - startX;
        const deltaY = e.changedTouches[0].clientY - startY;
        
        // Swipe from left edge of screen to right (standard back gesture)
        const isSwipeBack = startX < 80 && deltaX > 80 && Math.abs(deltaY) < 60;
        
        if (isSwipeBack) {
          console.log("Swipe back gesture detected, going back...");
          goBack();
        }
      }
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [navHistory, screen, activeTab, selectedOrder, selectedProduct, selectedRetailer, onBehalfRetailer]);

  // Fetch product reviews dynamically
  useEffect(() => {
    if (selectedProduct) {
      fetch(`${serverUrl}/api/products/${selectedProduct.id}/reviews`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setProductReviews(data);
        } else {
          setProductReviews([]);
        }
      })
      .catch(err => {
        console.error("Failed to fetch reviews:", err);
        setProductReviews([]);
      });
    } else {
      setProductReviews([]);
    }
  }, [selectedProduct, token, serverUrl]);

  // Submit product review to backend
  const handleSubmitReview = async () => {
    if (!selectedProduct) return;
    if (!reviewComment.trim()) {
      alert("Please write a comment for your review");
      return;
    }
    setIsSubmittingReview(true);
    try {
      const res = await fetch(`${serverUrl}/api/products/${selectedProduct.id}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment
        })
      });
      if (res.ok) {
        const newReview = await res.json();
        setProductReviews(prev => [newReview, ...prev]);
        setReviewComment('');
        setReviewRating(5);
      } else {
        alert("Failed to submit review");
      }
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Error submitting review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
      const res = await fetch(`${serverUrl}/api/admin/payment-config`, {
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
      const res = await fetch(`${serverUrl}/api/retailer/dashboard`, {
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
      const res = await fetch(`${serverUrl}/api/salesman/dashboard`, {
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
      const res = await fetch(`${serverUrl}/api/salesman/retailers`, {
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
      const res = await fetch(`${serverUrl}/api/products/categories`, {
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

      const url = `${serverUrl}/api/products?retailerId=${targetRetId}${selectedCategory ? `&categoryId=${selectedCategory}` : ''}${searchQuery ? `&q=${searchQuery}` : ''}`;
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

      const res = await fetch(`${serverUrl}/api/retailer/addresses?retailerId=${targetRetId}`, {
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
      const res = await fetch(`${serverUrl}/api/orders`, {
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
      const res = await fetch(`${serverUrl}/api/dues`, {
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
      const res = await fetch(`${serverUrl}/api/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        setOtpCode(data.simulatedOtp || '');
        onNotification('success', `OTP Sent! Simulated OTP is: ${data.simulatedOtp}`);
      } else {
        onNotification('error', data.error || 'Failed to send OTP');
      }
    } catch (err) {
      onNotification('error', `Server connection failed: ${err.message}`);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) {
      onNotification('warning', 'Please enter the OTP');
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/api/auth/verify-otp`, {
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
      onNotification('error', `Server connection failed: ${err.message}`);
    }
  };

  const handlePasswordLogin = async () => {
    if (!mobileNumber || !password) {
      onNotification('warning', 'Credentials cannot be empty');
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/api/auth/login-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber, password })
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned HTML instead of JSON. Make sure you set the App Settings URL to the backend port (5001), not the frontend port.');
      }
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setScreen('main');
        setActiveTab(data.user.role === 'salesman' ? 'dashboard' : 'home');
        onNotification('success', `Welcome, ${data.user.name}!`);
      } else {
        onNotification('error', 'Invalid username or password. Please try again.');
      }
    } catch (err) {
      onNotification('error', `Server connection failed: ${err.message}`);
    }
  };

  const handleRegister = async (e) => {
    if (e) e.preventDefault();
    if (!registerName || !registerMobile || !registerEmail || !registerPassword || !registerConfirmPassword) {
      onNotification('warning', 'All fields are required');
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      onNotification('error', 'Passwords do not match');
      return;
    }
    try {
      const res = await fetch(`${serverUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerName,
          mobileNumber: registerMobile,
          email: registerEmail,
          password: registerPassword
        })
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server returned HTML instead of JSON. Make sure you set the App Settings URL to the backend port (5001), not the frontend port.');
      }
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
        setScreen('main');
        setActiveTab('home');
        onNotification('success', `Registered & Logged in as ${data.user.name}`);
        setRegisterName('');
        setRegisterMobile('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterConfirmPassword('');
        setAuthView('login');
      } else {
        onNotification('error', data.error || 'Registration failed');
      }
    } catch (err) {
      onNotification('error', `Server connection failed: ${err.message}`);
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

  const handleCheckout = async (e, providedOtp = null) => {
    if (e) e.preventDefault();
    if (cart.length === 0) return;
    if (!checkoutAddress) {
      onNotification('warning', 'Please select a delivery address');
      return;
    }

    // Intercept checkout for salesman if OTP has not been provided/generated yet
    if (user.role === 'salesman' && !providedOtp) {
      try {
        const res = await fetch(`${serverUrl}/api/orders/generate-otp`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            retailerId: onBehalfRetailer?.id
          })
        });
        const data = await res.json();
        if (res.ok) {
          setSalesmanCheckoutOtpModal({
            otpSim: data.otpSim,
            enteredOtp: '',
            error: ''
          });
        } else {
          onNotification('error', data.error || 'Failed to generate order verification OTP');
        }
      } catch (err) {
        onNotification('error', 'Connection failed while generating OTP');
      }
      return;
    }

    const { finalTotal } = getCartTotals();
    const activeCredit = user.role === 'retailer' 
      ? retailerDashboard?.retailer?.availableCredit 
      : onBehalfRetailer?.availableCredit;

    try {
      const res = await fetch(`${serverUrl}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          retailerId: user.role === 'salesman' ? onBehalfRetailer?.id : user.id,
          paymentType: checkoutPayment,
          deliveryAddressId: parseInt(checkoutAddress),
          orderOtp: providedOtp,
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
        setSalesmanCheckoutOtpModal(null); // Close the OTP modal on success!
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

        if (checkoutPayment === 'qr_pay') {
          setQrCodePaymentOrder({
            orderNumber: data.orderNumber,
            finalAmount: data.finalAmount || finalTotal
          });
        }

        if (data.status === 'pending_approval') {
          onNotification('warning', 'Order placed! Exceeded credit limit, awaiting Admin Approval.');
          if (checkoutPayment !== 'qr_pay') {
            setActiveTab('orders');
          }
        } else {
          onNotification('success', `Order ${data.orderNumber} placed successfully!`);
          if (checkoutPayment !== 'qr_pay') {
            setActiveTab('orders');
          }
        }
      } else {
        if (user.role === 'salesman') {
          setSalesmanCheckoutOtpModal(prev => ({
            ...prev,
            error: data.error || 'Checkout failed'
          }));
        } else {
          onNotification('error', data.error || 'Checkout failed');
        }
      }
    } catch (err) {
      if (user.role === 'salesman') {
        setSalesmanCheckoutOtpModal(prev => ({
          ...prev,
          error: 'Connection failed'
        }));
      } else {
        onNotification('error', 'Connection failed');
      }
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      const res = await fetch(`${serverUrl}/api/orders/${orderId}/cancel`, {
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

  const handleRequestCredit = async (term) => {
    try {
      const res = await fetch(`${serverUrl}/api/retailer/request-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ creditTermRequest: term })
      });
      if (res.ok) {
        showLocalToast('success', `Request submitted for ${term === 'none' ? 'No Credit' : term.replace('_', ' ')}`);
        fetchRetailerDashboard();
      } else {
        const err = await res.json();
        showLocalToast('error', err.error || 'Failed to submit credit request');
      }
    } catch (err) {
      showLocalToast('error', `Request failed: ${err.message}`);
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
      ? `${serverUrl}/api/retailer/addresses/${editingAddressId}` 
      : `${serverUrl}/api/retailer/addresses`;

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
      const res = await fetch(`${serverUrl}/api/retailer/addresses/${addrId}?retailerId=${targetRetId}`, {
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
                  backgroundImage: `url(${resolveImageUrl(cat.imageUrl, serverUrl)})`,
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
              <div 
                key={prod.id} 
                className="card animate-hover" 
                onClick={() => { pushHistory(); setSelectedProduct(prod); }}
                style={{ padding: '6px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, overflow: 'hidden', cursor: 'pointer' }}
              >
                <div style={{
                  height: '75px',
                  borderRadius: '6px',
                  backgroundImage: `url(${resolveImageUrl(prod.images?.[0], serverUrl)})`,
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
                    onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                    className="btn btn-primary animate-hover" 
                    style={{ padding: '4px', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(13,71,161,0.2)' }}
                  >
                    <Plus size={18} />
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
              <div 
                key={prod.id} 
                className="card animate-hover" 
                onClick={() => { pushHistory(); setSelectedProduct(prod); }}
                style={{ display: 'flex', gap: '10px', padding: '8px', cursor: 'pointer' }}
              >
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '6px',
                  backgroundImage: `url(${resolveImageUrl(prod.images?.[0], serverUrl)})`,
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
                        onClick={(e) => { e.stopPropagation(); addToCart(prod); }}
                        disabled={prod.stockQuantity === 0}
                        className="btn btn-primary animate-hover"
                        style={{ padding: '4px', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(13,71,161,0.2)' }}
                      >
                        <Plus size={18} />
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
                <option value="qr_pay">UPI QR Code Payment</option>
                
                {(() => {
                  const approved = user.role === 'retailer' 
                    ? retailerDashboard?.retailer?.creditTermApproved 
                    : onBehalfRetailer?.creditTermApproved;
                  
                  return (
                    <>
                      {['due_7', 'due_15', 'due_30'].includes(approved) && (
                        <option value="due_7">Due 7 Days</option>
                      )}
                      {['due_15', 'due_30'].includes(approved) && (
                        <option value="due_15">Due 15 Days</option>
                      )}
                      {approved === 'due_30' && (
                        <option value="due_30">Due 30 Days</option>
                      )}
                    </>
                  );
                })()}
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

                <button
                  onClick={() => { pushHistory(); setSelectedOrder(isSelected ? null : order); }}
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

        {/* Credit Period Request Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: '#fff' }}>
          <h4 style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-light)', textTransform: 'uppercase', margin: 0 }}>Credit Term Status</h4>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Approved Credit Term:</span>
            <span style={{ fontWeight: 'bold', color: 'var(--primary)' }}>
              {retailerDashboard?.retailer?.creditTermApproved === 'none' || !retailerDashboard?.retailer?.creditTermApproved
                ? 'No Credit (COD / UPI)' 
                : retailerDashboard.retailer.creditTermApproved.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span>Credit Limit:</span>
            <span style={{ fontWeight: 'bold' }}>₹{retailerDashboard?.retailer?.creditLimit?.toLocaleString() || '0'}</span>
          </div>

          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '4px' }}>
            <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-light)', marginBottom: '6px' }}>Request Credit Period Approval:</span>
            
            {retailerDashboard?.retailer?.creditRequestStatus === 'pending' ? (
              <div style={{ padding: '8px', background: 'var(--warning-light)', color: 'var(--warning)', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', textAlign: 'center' }}>
                Pending Approval: {retailerDashboard.retailer.creditTermRequest.replace('_', ' ').toUpperCase()}
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '6px' }}>
                {['due_7', 'due_15', 'due_30'].map(term => (
                  <button
                    key={term}
                    onClick={() => handleRequestCredit(term)}
                    disabled={retailerDashboard?.retailer?.creditTermApproved === term}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '4px 2px', fontSize: '0.65rem' }}
                  >
                    {term.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            )}
            
            {retailerDashboard?.retailer?.creditRequestStatus === 'rejected' && (
              <div style={{ marginTop: '6px', fontSize: '0.65rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                ⚠️ Previous credit request was rejected. You can submit a new request above.
              </div>
            )}
          </div>
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

  const renderProductDetailsModal = () => {
    if (!selectedProduct) return null;
    
    // Find if product is already in cart
    const cartItem = cart.find(item => item.productId === selectedProduct.id);
    const quantity = cartItem ? cartItem.quantity : 0;
    
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
        <div className="card animate-slide-in" style={{ width: '100%', maxWidth: '360px', maxHeight: '90vh', overflowY: 'auto', padding: '20px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="badge badge-primary" style={{ fontSize: '0.65rem', marginBottom: '4px', display: 'inline-block' }}>SKU: {selectedProduct.sku}</span>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0', paddingRight: '20px' }}>{selectedProduct.name}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-light)', margin: 0 }}>Brand: <strong>{selectedProduct.brand}</strong> | Category: <strong>{selectedProduct.ProductCategory?.name || 'Hardware'}</strong></p>
            </div>
            <button 
              onClick={() => setSelectedProduct(null)}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              ✕
            </button>
          </div>
          
          {/* Product Image */}
          <div style={{
            width: '100%', height: '180px', borderRadius: '10px', overflow: 'hidden',
            background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <img src={resolveImageUrl(selectedProduct.images?.[0] || selectedProduct.imageUrl, serverUrl)} alt={selectedProduct.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
          </div>
          
          {/* Pricing & Stock Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div style={{ background: '#f0f9ff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
              <div style={{ fontSize: '0.6rem', color: '#0369a1', fontWeight: 600 }}>Wholesale Price</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>₹{parseFloat(selectedProduct.price).toLocaleString()}</div>
            </div>
            <div style={{ 
              background: selectedProduct.stockQuantity === 0 ? '#fef2f2' : (selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold ? '#fffbeb' : '#f0fdf4'), 
              padding: '8px 10px', 
              borderRadius: '8px', 
              border: selectedProduct.stockQuantity === 0 ? '1px solid #fee2e2' : (selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold ? '1px solid #fef3c7' : '1px solid #bbf7d0')
            }}>
              <div style={{ 
                fontSize: '0.6rem', 
                color: selectedProduct.stockQuantity === 0 ? '#b91c1c' : (selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold ? '#b45309' : '#15803d'), 
                fontWeight: 600 
              }}>Stock Status</div>
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                color: selectedProduct.stockQuantity === 0 ? '#dc2626' : (selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold ? '#d97706' : '#16a34a'), 
                marginTop: '4px' 
              }}>
                {selectedProduct.stockQuantity === 0 ? 'Out of Stock' : (selectedProduct.stockQuantity <= selectedProduct.lowStockThreshold ? 'Low Stock' : `${selectedProduct.stockQuantity} units`)}
              </div>
            </div>
          </div>
          
          {/* Description Section */}
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-main)', margin: '0 0 4px 0' }}>Product Description</h4>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4, background: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', margin: 0 }}>
              {selectedProduct.description || 'Official genuine hardware component backed by comprehensive brand warranty and distributor support.'}
            </p>
          </div>

          {/* Verified Reviews (same as admin) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--text-main)', margin: 0 }}>Verified Partner Reviews</h4>
              <span style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#d97706', display: 'flex', alignItems: 'center', gap: '2px' }}>
                ⭐ {productReviews.length > 0 ? (productReviews.reduce((sum, r) => sum + parseFloat(r.rating), 0) / productReviews.length).toFixed(1) : 'N/A'} Rating
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {productReviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-light)', fontSize: '0.7rem' }}>
                  No reviews yet. Be the first to review this product!
                </div>
              ) : (
                productReviews.map((rev, idx) => (
                  <div key={idx} style={{ background: '#f9fafb', padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                      <strong>{rev.reviewerName}</strong>
                      <span style={{ color: '#d97706' }}>
                        {'⭐'.repeat(Math.max(1, Math.min(5, Math.round(parseFloat(rev.rating)))))}
                      </span>
                    </div>
                    {rev.comment && (
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px', margin: '2px 0 0' }}>
                        "{rev.comment}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
            
            {/* Add Review Form */}
            <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', marginTop: '10px' }}>
              <h5 style={{ fontSize: '0.75rem', fontWeight: 'bold', margin: '0 0 6px 0', color: 'var(--text-main)' }}>Add Your Review</h5>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Rating:</span>
                  <select 
                    value={reviewRating} 
                    onChange={(e) => setReviewRating(parseFloat(e.target.value))}
                    style={{ fontSize: '0.7rem', padding: '2px 4px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'white' }}
                  >
                    <option value="5">5 ⭐⭐⭐⭐⭐</option>
                    <option value="4">4 ⭐⭐⭐⭐</option>
                    <option value="3">3 ⭐⭐⭐</option>
                    <option value="2">2 ⭐⭐</option>
                    <option value="1">1 ⭐</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input 
                    type="text" 
                    placeholder="Write your review here..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    style={{ flex: 1, fontSize: '0.7rem', padding: '6px', borderRadius: '4px', border: '1px solid var(--border-color)', background: '#f8fafc' }}
                  />
                  <button 
                    onClick={handleSubmitReview}
                    disabled={isSubmittingReview}
                    style={{ 
                      padding: '4px 10px', 
                      fontSize: '0.7rem', 
                      backgroundColor: 'var(--primary)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      fontWeight: 'bold',
                      cursor: 'pointer' 
                    }}
                  >
                    {isSubmittingReview ? '...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Actions */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', marginTop: '4px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            {quantity > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
                <button 
                  onClick={() => updateCartQty(selectedProduct.id, -1)}
                  className="btn btn-outline"
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                >
                  <Minus size={14} />
                </button>
                <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{quantity} in Cart</span>
                <button 
                  onClick={() => updateCartQty(selectedProduct.id, 1)}
                  className="btn btn-outline"
                  style={{ width: '32px', height: '32px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                >
                  <Plus size={14} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => addToCart(selectedProduct)}
                disabled={selectedProduct.stockQuantity === 0}
                className="btn btn-primary"
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px 0', borderRadius: '6px' }}
              >
                <Plus size={16} />
                <span>Add to Cart</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderQrPaymentModal = () => {
    if (!qrCodePaymentOrder) return null;
    
    const upiId = '9775375365@okbizaxis';
    const merchantName = 'BISWAS ENTERPRISE';
    const amount = parseFloat(qrCodePaymentOrder.finalAmount).toFixed(2);
    const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR`;
    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiUrl)}`;

    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div className="card" style={{ width: '90%', maxWidth: '340px', padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', background: '#f8f9fa' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <div style={{ background: '#1976d2', color: 'white', padding: '6px', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 'bold' }}>UPI</div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold', margin: 0 }}>Google Pay Checkout</h3>
              <span style={{ fontSize: '0.65rem', color: 'var(--text-light)' }}>Biswas Enterprise Distribution</span>
            </div>
          </div>
          
          {/* Bill Details */}
          <div style={{ width: '100%', background: 'white', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Order Number:</span>
              <span style={{ fontWeight: 'bold' }}>{qrCodePaymentOrder.orderNumber}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Merchant:</span>
              <span style={{ fontWeight: 'bold' }}>{merchantName}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', borderTop: '1px dotted #ccc', paddingTop: '4px', marginTop: '4px' }}>
              <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>Amount Payable:</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>₹{parseFloat(amount).toLocaleString()}</span>
            </div>
          </div>

          {/* QR Code Container */}
          <div style={{ background: 'white', padding: '12px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <img 
              src={qrImgUrl} 
              alt="Scan to Pay" 
              style={{ width: '160px', height: '160px', border: '1px solid #f1f5f9' }} 
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: '600' }}>Scan QR using Google Pay, PhonePe or Paytm</span>
          </div>

          {/* UPI ID Info */}
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
            <div>UPI ID: <strong style={{ color: 'var(--text-main)' }}>{upiId}</strong></div>
            <div style={{ marginTop: '2px', fontSize: '0.6rem', color: 'var(--text-light)' }}>Please verify Merchant Name: <strong>BISWAS ENTERPRISE</strong> before confirming</div>
          </div>

          {/* Done/Close Actions */}
          <div style={{ width: '100%', display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={() => {
                setQrCodePaymentOrder(null);
                setActiveTab('orders');
              }}
              className="btn btn-primary animate-hover"
              style={{ flex: 1, padding: '10px 0', fontSize: '0.75rem', borderRadius: '6px' }}
            >
              Confirm Payment Completed
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSalesmanCheckoutOtpModal = () => {
    if (!salesmanCheckoutOtpModal) return null;
    
    return (
      <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
        <div className="card" style={{ width: '90%', maxWidth: '340px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 'bold', margin: 0 }}>Verify Order Placement</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>
            An order verification OTP has been generated for <strong>{onBehalfRetailer?.name}</strong>.
          </p>

          <div style={{ background: '#e0f2f1', padding: '8px 12px', borderRadius: '4px', borderLeft: '4px solid #00bfa5', fontSize: '0.75rem', color: '#00796b' }}>
            <strong>OTP Code (Simulated):</strong> {salesmanCheckoutOtpModal.otpSim}
          </div>

          <div className="form-group">
            <label style={{ fontSize: '0.75rem' }}>Enter 6-Digit OTP</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. 123456" 
              maxLength="6"
              value={salesmanCheckoutOtpModal.enteredOtp}
              onChange={(e) => setSalesmanCheckoutOtpModal(prev => ({ ...prev, enteredOtp: e.target.value, error: '' }))}
              style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.1rem', fontWeight: 'bold' }}
            />
          </div>

          {salesmanCheckoutOtpModal.error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.7rem', fontWeight: '600' }}>
              ⚠️ {salesmanCheckoutOtpModal.error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={() => setSalesmanCheckoutOtpModal(null)} 
              className="btn btn-outline" 
              style={{ flex: 1, padding: '10px 0', fontSize: '0.75rem' }}
            >
              Cancel
            </button>
            <button 
              onClick={() => handleCheckout(null, salesmanCheckoutOtpModal.enteredOtp)} 
              disabled={salesmanCheckoutOtpModal.enteredOtp.length !== 6}
              className="btn btn-primary" 
              style={{ flex: 1, padding: '10px 0', fontSize: '0.75rem' }}
            >
              Verify & Confirm
            </button>
          </div>
        </div>
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
                  const res = await fetch(`${serverUrl}/api/salesman/retailers/${r.id}`, {
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
  // CONNECTION SETTINGS MODAL
  // ==========================================
  const renderSettingsModal = () => {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '320px',
          padding: '20px',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
              <Settings size={18} style={{ color: 'var(--primary)' }} /> Connection Settings
            </h3>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-light)', marginTop: '4px', margin: '4px 0 0' }}>
              Set the backend server URL (e.g. for development or custom servers).
            </p>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label style={{ fontSize: '0.7rem', display: 'block', marginBottom: '4px' }}>Backend API Base URL</label>
            <input
              type="text"
              className="form-control"
              style={{ fontSize: '0.75rem', padding: '8px', width: '100%' }}
              value={tempServerUrl}
              onChange={(e) => setTempServerUrl(e.target.value)}
              placeholder="e.g. http://10.0.2.2:5001"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button
              onClick={() => setShowSettingsModal(false)}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '8px' }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                localStorage.setItem('API_BASE_MOBILE', tempServerUrl);
                setServerUrl(tempServerUrl);
                setShowSettingsModal(false);
                onNotification('success', 'Server URL updated successfully');
              }}
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '8px' }}
            >
              Save URL
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // LOGIN SCREEN
  // ==========================================
  const renderLogin = () => {
    if (authView === 'register') {
      return (
        <div style={{
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          height: '100%',
          background: '#fff',
          overflowY: 'auto',
          position: 'relative'
        }}>
          {/* Settings button on register screen */}
          <button
            onClick={() => {
              setTempServerUrl(serverUrl);
              setShowSettingsModal(true);
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(0, 0, 0, 0.05)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-light)',
              zIndex: 1000
            }}
            title="App Settings"
          >
            <Settings size={18} />
          </button>

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
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>CREATE ACCOUNT</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>REGISTER AS A NEW RETAILER (T3 GROUP)</p>
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="form-group">
              <label>Retailer Store Name</label>
              <input
                type="text"
                placeholder="Enter store name"
                className="form-control"
                value={registerName}
                onChange={(e) => setRegisterName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Mobile Number</label>
              <input
                type="tel"
                placeholder="Enter 10-digit number"
                className="form-control"
                value={registerMobile}
                onChange={(e) => setRegisterMobile(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter email address"
                className="form-control"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Create password"
                className="form-control"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                placeholder="Verify password"
                className="form-control"
                value={registerConfirmPassword}
                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', fontWeight: '600', marginTop: '8px' }}
            >
              Submit Registration
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button 
              onClick={() => setAuthView('login')}
              style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}
            >
              Already have an account? Login here
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        background: '#fff',
        position: 'relative'
      }}>
        {/* Settings button on login screen */}
        <button
          onClick={() => {
            setTempServerUrl(serverUrl);
            setShowSettingsModal(true);
          }}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(0, 0, 0, 0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: 'var(--text-light)',
            zIndex: 1000
          }}
          title="App Settings"
        >
          <Settings size={18} />
        </button>
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
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="form-control"
                  style={{ paddingLeft: '32px', paddingRight: '36px' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '9px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-light)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0
                  }}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
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

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <button 
            onClick={() => setAuthView('register')}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}
          >
            Don't have an account? Register as Retailer
          </button>
        </div>
      </div>
    );
  };

  // Main wrapper render logic
  const renderContent = () => {
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
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Settings button on splash screen */}
          <button
            onClick={() => {
              setTempServerUrl(serverUrl);
              setShowSettingsModal(true);
            }}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              zIndex: 1000
            }}
            title="App Settings"
          >
            <Settings size={18} />
          </button>

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
              {navHistory.length > 0 ? (
                <button 
                  onClick={goBack}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '1.2rem', paddingRight: '4px' }}
                >
                  ←
                </button>
              ) : onBehalfRetailer ? (
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
              ) : null}
              <span style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'white' }}>{getHeaderTitle()}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Show cart badge for active retailer/on behalf retailer */}
              {((user?.role === 'retailer') || onBehalfRetailer) && (
                <button 
                  onClick={() => setActiveTab('cart')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    position: 'relative',
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.45rem',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                    transition: 'background 0.2s'
                  }}
                >
                  🛒
                  {cart.length > 0 && (
                    <span style={{
                      position: 'absolute', top: '-2px', right: '-2px',
                      background: 'var(--danger)', color: 'white',
                      fontSize: '0.6rem', borderRadius: '50%', padding: '2px 5px',
                      fontWeight: 'bold',
                      border: '2px solid var(--primary)',
                      minWidth: '16px',
                      height: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
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
            padding: '6px 0',
            flexShrink: 0
          }}>
            {user.role === 'retailer' ? (
              <>
                <button onClick={() => { pushHistory(); setActiveTab('home'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'home' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'home' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>🏠</span>
                  <span>Home</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('products'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'products' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'products' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>📦</span>
                  <span>Catalog</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('orders'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>📋</span>
                  <span>Orders</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('dues'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'dues' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'dues' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>💰</span>
                  <span>Dues</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('profile'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>👤</span>
                  <span>Profile</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { pushHistory(); setActiveTab('dashboard'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'dashboard' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>📈</span>
                  <span>Dashboard</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('retailers'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'retailers' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'retailers' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>👥</span>
                  <span>Retailers</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('orders'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'orders' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'orders' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>📋</span>
                  <span>Orders</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('dues'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'dues' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'dues' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>💰</span>
                  <span>Dues</span>
                </button>
                <button onClick={() => { pushHistory(); setActiveTab('profile'); }} style={{ flex: 1, background: 'none', border: 'none', color: activeTab === 'profile' ? 'var(--primary)' : 'var(--text-light)', fontSize: '0.6rem', fontWeight: activeTab === 'profile' ? 'bold' : 'normal', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: '1.1rem', marginBottom: '2px' }}>👤</span>
                  <span>Profile</span>
                </button>
              </>
            )}
          </div>

        </div>

      </div>
    );
  };

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
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      {renderContent()}

      {/* Product Details Modal */}
      {selectedProduct && renderProductDetailsModal()}

      {/* QR Payment Modal */}
      {qrCodePaymentOrder && renderQrPaymentModal()}

      {/* Salesman Checkout OTP Modal */}
      {salesmanCheckoutOtpModal && renderSalesmanCheckoutOtpModal()}

      {/* Settings Modal */}
      {showSettingsModal && renderSettingsModal()}

      {/* Local Mobile Toasts Container */}
      {localToasts.length > 0 && (
        <div className="mobile-toast-container" style={{ zIndex: 9999 }}>
          {localToasts.map(toast => (
            <div key={toast.id} className={`mobile-toast mobile-toast-${toast.type}`}>
              <div className="mobile-toast-body">
                <strong>{toast.type.toUpperCase()}: </strong>
                <span>{toast.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
