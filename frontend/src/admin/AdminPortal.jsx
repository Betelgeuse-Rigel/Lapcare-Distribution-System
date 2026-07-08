import React, { useState, useEffect } from 'react';
import { API_BASE, resolveImageUrl } from '../config';
import { 
  LayoutDashboard, UserCheck, Users, ShieldAlert,
  ShoppingBag, HelpCircle, Key, Plus, FileText, CheckCircle, 
  XCircle, Edit, DollarSign, Settings, Download, Trash2, Layers,
  Eye, EyeOff
} from 'lucide-react';

export default function AdminPortal({ onNotification }) {
  // Authentication State
  const [token, setToken] = useState(localStorage.getItem('admin_token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Dashboard & Navigation States
  const [activeSubTab, setActiveSubTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);

  // Entities Data
  const [retailers, setRetailers] = useState([]);
  const [salesmen, setSalesmen] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dues, setDues] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentConfigs, setPaymentConfigs] = useState([]);

  // Modals & Forms States
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [retailerModalOpen, setRetailerModalOpen] = useState(false);
  const [salesmanModalOpen, setSalesmanModalOpen] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);

  // Form payload states
  const [retailerForm, setRetailerForm] = useState({ name: '', mobileNumber: '', email: '', password: '', category: 'T1', creditLimit: 0, assignedSalesmanId: '', creditTermApproved: 'none', creditRequestStatus: 'none' });
  const [salesmanForm, setSalesmanForm] = useState({ name: '', mobileNumber: '', email: '', password: '' });
  const [productForm, setProductForm] = useState({ name: '', sku: '', brand: '', categoryId: '', description: '', priceT1: 0, priceT2: 0, priceT3: 0, stockQuantity: 0, lowStockThreshold: 5, isFeatured: false, imageUrl: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', imageUrl: '', sortOrder: 0 });
  const [stockForm, setStockForm] = useState({ productId: '', quantity: 0, reason: '' });
  const [targetForm, setTargetForm] = useState({ salesmanId: '', targetOrders: 0, targetRevenue: 0, targetDuesCollected: 0 });
  const [paymentForm, setPaymentForm] = useState({ dueId: '', amountReceived: 0, note: '' });
  
  const [editingRetailerId, setEditingRetailerId] = useState(null);
  const [editingSalesmanId, setEditingSalesmanId] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);

  const [creditApprovalNote, setCreditApprovalNote] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');

  // Config parameters
  const [codCharge, setCodCharge] = useState(50);
  const [due7Rate, setDue7Rate] = useState(1);
  const [due15Rate, setDue15Rate] = useState(2);

  // Load backend data if authenticated
  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token);
      fetchDashboard();
      fetchRetailers();
      fetchSalesmen();
      fetchProducts();
      fetchOrders();
      fetchDues();
      fetchCategories();
      fetchPaymentConfigs();
    } else {
      localStorage.removeItem('admin_token');
    }
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRetailers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/retailers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRetailers(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSalesmen = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/salesmen`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSalesmen(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/products`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDues = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/dues`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDues(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPaymentConfigs = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/payment-config`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPaymentConfigs(data);
        const cod = data.find(c => c.paymentType === 'cod');
        const due7 = data.find(c => c.paymentType === 'due_7');
        const due15 = data.find(c => c.paymentType === 'due_15');
        if (cod) setCodCharge(parseFloat(cod.flatCharge));
        if (due7) setDue7Rate(parseFloat(due7.percentageRate));
        if (due15) setDue15Rate(parseFloat(due15.percentageRate));
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ==========================================
  // AUTH FLOW
  // ==========================================
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        onNotification('success', 'Admin login successful');
      } else {
        onNotification('error', data.error || 'Access denied');
      }
    } catch (err) {
      onNotification('error', 'Database connection failed');
    }
  };

  const handleLogout = () => {
    setToken(null);
    onNotification('info', 'Admin logged out');
  };

  // ==========================================
  // CREDIT QUEUE ACTIONS
  // ==========================================
  const handleApproveCredit = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/approve-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note: creditApprovalNote })
      });
      if (res.ok) {
        onNotification('success', 'Credit limit order approved successfully!');
        setCreditApprovalNote('');
        fetchOrders();
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Operation failed');
    }
  };

  const handleRejectCredit = async (orderId) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/reject-credit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ note: creditApprovalNote })
      });
      if (res.ok) {
        onNotification('warning', 'Order credit rejected and cancelled.');
        setCreditApprovalNote('');
        fetchOrders();
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Operation failed');
    }
  };

  // ==========================================
  // RETAILER CRUD ACTIONS
  // ==========================================
  const handleSaveRetailer = async (e) => {
    e.preventDefault();
    const payload = { ...retailerForm };
    if (!payload.assignedSalesmanId) delete payload.assignedSalesmanId;
    
    const method = editingRetailerId ? 'PUT' : 'POST';
    const url = editingRetailerId 
      ? `${API_BASE}/api/admin/retailers/${editingRetailerId}` 
      : `${API_BASE}/api/admin/retailers`;

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
        onNotification('success', editingRetailerId ? 'Retailer updated' : 'Retailer created successfully');
        setRetailerModalOpen(false);
        setEditingRetailerId(null);
        setRetailerForm({ name: '', mobileNumber: '', email: '', password: '', category: 'T1', creditLimit: 0, assignedSalesmanId: '', creditTermApproved: 'none', creditRequestStatus: 'none' });
        fetchRetailers();
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Failed to save retailer');
    }
  };

  const handleReviewCreditTerm = async (retailerId, status, approvedTerm) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/retailers/${retailerId}/review-credit-term`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, approvedTerm })
      });
      if (res.ok) {
        onNotification('success', `Credit period request ${status === 'approved' ? 'approved' : 'rejected'} successfully!`);
        fetchRetailers();
        fetchDashboard();
      } else {
        const err = await res.json();
        onNotification('error', err.error || 'Failed to review credit term');
      }
    } catch (err) {
      onNotification('error', `Connection error: ${err.message}`);
    }
  };

  const handleDeleteRetailer = async (retailerId) => {
    if (!window.confirm("Are you sure you want to delete this retailer account?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/retailers/${retailerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        onNotification('success', 'Retailer account deleted successfully');
        fetchRetailers();
        fetchDashboard();
      } else {
        const err = await res.json();
        onNotification('error', err.error || 'Failed to delete retailer');
      }
    } catch (err) {
      onNotification('error', `Connection error: ${err.message}`);
    }
  };

  // ==========================================
  // SALESMAN CRUD ACTIONS
  // ==========================================
  const handleSaveSalesman = async (e) => {
    e.preventDefault();
    const method = editingSalesmanId ? 'PUT' : 'POST';
    const url = editingSalesmanId 
      ? `${API_BASE}/api/admin/salesmen/${editingSalesmanId}` 
      : `${API_BASE}/api/admin/salesmen`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(salesmanForm)
      });
      if (res.ok) {
        onNotification('success', editingSalesmanId ? 'Salesman updated' : 'Salesman registered successfully');
        setSalesmanModalOpen(false);
        setEditingSalesmanId(null);
        setSalesmanForm({ name: '', mobileNumber: '', email: '', password: '' });
        fetchSalesmen();
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Failed to save salesman');
    }
  };

  const handleDeleteSalesman = async (salesmanId) => {
    if (!window.confirm("Are you sure you want to delete this salesperson account?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/salesmen/${salesmanId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        onNotification('success', 'Salesperson account deleted successfully');
        fetchSalesmen();
        fetchDashboard();
      } else {
        const err = await res.json();
        onNotification('error', err.error || 'Failed to delete salesperson');
      }
    } catch (err) {
      onNotification('error', `Connection error: ${err.message}`);
    }
  };

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/salesmen/${targetForm.salesmanId}/targets`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(targetForm)
      });
      if (res.ok) {
        onNotification('success', 'Monthly performance targets configured');
        setTargetModalOpen(false);
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Failed to save targets');
    }
  };

  const handleFileUpload = async (file, callback) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch(`${API_BASE}/api/admin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        callback(data.url);
        onNotification('success', 'Image uploaded successfully!');
      } else {
        onNotification('error', data.error || 'Failed to upload image');
      }
    } catch (err) {
      onNotification('error', `Upload error: ${err.message}`);
    }
  };

  // ==========================================
  // PRODUCTS CRUD & STOCK ADJUSTMENTS
  // ==========================================
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId 
      ? `${API_BASE}/api/admin/products/${editingProductId}` 
      : `${API_BASE}/api/admin/products`;

    try {
      const payload = {
        ...productForm,
        images: productForm.imageUrl ? [productForm.imageUrl] : []
      };
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        onNotification('success', editingProductId ? 'Product details updated' : 'Product created in inventory');
        setProductModalOpen(false);
        setEditingProductId(null);
        setProductForm({ name: '', sku: '', brand: '', categoryId: '', description: '', priceT1: 0, priceT2: 0, priceT3: 0, stockQuantity: 0, lowStockThreshold: 5, isFeatured: false, imageUrl: '' });
        fetchProducts();
      }
    } catch (err) {
      onNotification('error', 'Failed to save product');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${stockForm.productId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(stockForm)
      });
      if (res.ok) {
        onNotification('success', 'Product stock level adjusted and logged');
        setStockModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      onNotification('error', 'Failed to adjust stock');
    }
  };

  const handleToggleProductActive = async (id, currentActiveStatus, name) => {
    const actionText = currentActiveStatus !== false ? 'deactivate (hide from mobile catalog)' : 'activate (show in mobile catalog)';
    if (!window.confirm(`Are you sure you want to ${actionText} "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}/toggle-active`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        onNotification('success', data.message);
        fetchProducts();
      }
    } catch (err) {
      onNotification('error', 'Failed to update product status');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`PERMANENT DELETION WARNING:\nAre you sure you want to permanently delete "${name}" from the entire system? This cannot be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onNotification('success', 'Product permanently deleted');
        fetchProducts();
      }
    } catch (err) {
      onNotification('error', 'Failed to delete product');
    }
  };

  // ==========================================
  // CATEGORY CRUD
  // ==========================================
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const method = editingCategoryId ? 'PUT' : 'POST';
    const url = editingCategoryId 
      ? `${API_BASE}/api/admin/categories/${editingCategoryId}` 
      : `${API_BASE}/api/admin/categories`;

    try {
      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        onNotification('success', editingCategoryId ? 'Category details updated' : 'Product category added');
        setCategoryModalOpen(false);
        setEditingCategoryId(null);
        setCategoryForm({ name: '', imageUrl: '', sortOrder: 0 });
        fetchCategories();
      }
    } catch (err) {
      onNotification('error', 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate category "${name}"?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/admin/categories/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        onNotification('success', 'Category deactivated');
        fetchCategories();
      }
    } catch (err) {
      onNotification('error', 'Failed to delete category');
    }
  };

  // ==========================================
  // DUES COLLECTION
  // ==========================================
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/dues/${paymentForm.dueId}/record-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(paymentForm)
      });
      const data = await res.json();
      if (res.ok) {
        onNotification('success', 'Due payment transaction successfully recorded');
        setPaymentModalOpen(false);
        fetchDues();
        fetchRetailers();
        fetchDashboard();
      } else {
        onNotification('error', data.error || 'Payment recording failed');
      }
    } catch (err) {
      onNotification('error', 'Failed to connect to database');
    }
  };

  // ==========================================
  // CONFIG SURCHARGES
  // ==========================================
  const handleSaveConfigs = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/admin/payment-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          configs: [
            { paymentType: 'cod', flatCharge: codCharge },
            { paymentType: 'due_7', percentageRate: due7Rate },
            { paymentType: 'due_15', percentageRate: due15Rate }
          ]
        })
      });
      if (res.ok) {
        onNotification('success', 'Surcharges and configs saved');
        fetchPaymentConfigs();
      }
    } catch (err) {
      onNotification('error', 'Failed to save configurations');
    }
  };

  // CRON OVERDUE CHECK TRIGGER
  const triggerOverdueCheck = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/cron/check-overdue`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        onNotification('info', `Cron complete: Marked ${data.count} bills as Overdue.`);
        fetchDues();
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Failed to trigger cron');
    }
  };

  // Change order shipping status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        onNotification('success', `Order status updated to ${newStatus}`);
        fetchOrders();
        fetchDues();
        fetchRetailers();
        fetchDashboard();
      }
    } catch (err) {
      onNotification('error', 'Status transition failed');
    }
  };

  // Login view if not authenticated
  if (!token) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '20px'
      }}>
        <form 
          onSubmit={handleLogin}
          className="card" 
          style={{ width: '100%', maxWidth: '360px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid #334155', background: '#1e293b', boxShadow: 'var(--shadow-xl)' }}
        >
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>ADMIN PORTAL</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.75rem', marginTop: '4px' }}>BISWAS DISTRIBUTION HEAD OFFICE</p>
          </div>

          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>Admin Email</label>
            <input 
              type="email" 
              placeholder="admin@company.com" 
              className="form-control"
              style={{ background: '#0f172a', border: '1px solid #475569', color: 'white' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ color: '#cbd5e1' }}>Security Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                className="form-control"
                style={{ background: '#0f172a', border: '1px solid #475569', color: 'white', paddingRight: '36px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
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
                  color: '#cbd5e1',
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

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontWeight: 'bold' }}
          >
            Authenticate & Access
          </button>
        </form>
      </div>
    );
  }

  // Loading indicator for main screens
  if (!dashboardData) {
    return <div style={{ color: 'white', padding: '40px', textAlign: 'center' }}>Loading admin dashboard metrics...</div>;
  }

  const { kpis, highestOutstandingRetailers, topRetailers, inactiveRetailers, salesmanPerformances } = dashboardData;

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 54px)', background: 'var(--bg-main)' }}>
      
      {/* Left Sidebar navigation */}
      <div style={{
        width: '240px',
        background: 'white',
        borderRight: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '16px 0'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'credit', label: 'Credit approvals', icon: ShieldAlert, badge: kpis.pendingApprovalsCount },
            { id: 'retailers', label: 'Retailers list', icon: Users },
            { id: 'salesmen', label: 'Salesmen tracking', icon: UserCheck },
            { id: 'categories', label: 'Product categories', icon: Layers },
            { id: 'products', label: 'Product catalog', icon: ShoppingBag },
            { id: 'orders', label: 'Orders list', icon: FileText },
            { id: 'dues', label: 'Account receivables', icon: DollarSign },
            { id: 'config', label: 'General configs', icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 20px',
                  background: isActive ? 'var(--primary-light)' : 'none',
                  border: 'none',
                  borderLeft: `4px solid ${isActive ? 'var(--primary)' : 'transparent'}`,
                  color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </div>
                {tab.badge > 0 && (
                  <span style={{
                    background: 'var(--danger)', color: 'white', fontSize: '0.65rem',
                    padding: '2px 6px', borderRadius: '10px', fontWeight: 'bold'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Logout bottom */}
        <div style={{ padding: '0 20px' }}>
          <button 
            onClick={handleLogout}
            className="btn btn-outline"
            style={{ width: '100%', fontSize: '0.8rem', justifyContent: 'center' }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Panel Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
        
        {/* VIEW 1: DASHBOARD */}
        {activeSubTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* KPI Cards row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px' }}>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>TODAY'S ORDERS</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{kpis.todayOrdersCount}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>TODAY'S REVENUE</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>₹{parseFloat(kpis.todayOrdersValue).toLocaleString()}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '4px solid var(--danger)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>PENDING APPROVAL</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>{kpis.pendingApprovalsCount}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>ACTIVE DUES</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning)' }}>₹{parseFloat(kpis.totalActiveDues).toLocaleString()}</span>
              </div>
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderLeft: '4px solid var(--danger)' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', textTransform: 'uppercase' }}>OVERDUE ACCOUNTS</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>₹{parseFloat(kpis.totalOverdueDues).toLocaleString()}</span>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="card" style={{ padding: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-light)' }}>
              <div>
                <strong style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>Ledger Maintenance Tasks</strong>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Scan and trigger late payments to 'Overdue' status and push push alert notifications to mobile applications.</p>
              </div>
              <button onClick={triggerOverdueCheck} className="btn btn-primary" style={{ fontSize: '0.8rem' }}>
                ⏰ Run Overdue Batch Scan
              </button>
            </div>

            {/* Salesmen Performance trackers */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 'bold' }}>Salesman Monthly Targets Progress</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '10px 0' }}>Salesman Name</th>
                    <th>Orders Target</th>
                    <th>Revenue Target</th>
                    <th>Dues Target</th>
                  </tr>
                </thead>
                <tbody>
                  {salesmanPerformances.map(sp => {
                    const ordersPct = sp.targets.orders > 0 ? (sp.actual.orders / sp.targets.orders) * 100 : 100;
                    const revenuePct = sp.targets.revenue > 0 ? (sp.actual.revenue / sp.targets.revenue) * 100 : 100;
                    const duesPct = sp.targets.dues > 0 ? (sp.actual.dues / sp.targets.dues) * 100 : 100;

                    const getPctColor = (pct) => pct >= 85 ? 'var(--success)' : (pct >= 50 ? 'var(--warning)' : 'var(--danger)');

                    return (
                      <tr key={sp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 0', fontWeight: 'bold' }}>{sp.name}</td>
                        <td>
                          <span style={{ color: getPctColor(ordersPct), fontWeight: 'bold' }}>{sp.actual.orders}</span> / {sp.targets.orders} ({ordersPct.toFixed(0)}%)
                        </td>
                        <td>
                          <span style={{ color: getPctColor(revenuePct), fontWeight: 'bold' }}>₹{sp.actual.revenue.toLocaleString()}</span> / ₹{sp.targets.revenue.toLocaleString()} ({revenuePct.toFixed(0)}%)
                        </td>
                        <td>
                          <span style={{ color: getPctColor(duesPct), fontWeight: 'bold' }}>₹{sp.actual.dues.toLocaleString()}</span> / ₹{sp.targets.dues.toLocaleString()} ({duesPct.toFixed(0)}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom grids (Outstanding / Inactives) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Top Accounts Receivable Dues</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 0' }}>Retailer</th>
                      <th>Category</th>
                      <th>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {highestOutstandingRetailers.map(r => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '8px 0' }}>{r.name}</td>
                        <td>{r.category}</td>
                        <td style={{ fontWeight: 'bold', color: 'var(--danger)' }}>₹{parseFloat(r.currentOutstanding).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Inactive Retailers (No Orders &gt; 30 Days)</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)', textAlign: 'left' }}>
                      <th style={{ padding: '6px 0' }}>Retailer</th>
                      <th>Contact</th>
                      <th>Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inactiveRetailers.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '20px', color: 'var(--text-light)' }}>All active in last 30 days</td>
                      </tr>
                    ) : (
                      inactiveRetailers.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '8px 0' }}>{r.name}</td>
                          <td>{r.mobileNumber}</td>
                          <td>₹{parseFloat(r.currentOutstanding).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 2: CREDIT APPROVAL QUEUE */}
        {activeSubTab === 'credit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Credit Limit Exception Approval Queue</h3>
            
            {orders.filter(o => o.status === 'pending_approval').length === 0 ? (
              <div className="card" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-light)' }}>
                🎉 No orders are currently awaiting credit limit approval.
              </div>
            ) : (
              orders.filter(o => o.status === 'pending_approval').map(order => {
                const availCredit = parseFloat(order.Retailer?.creditLimit) - parseFloat(order.Retailer?.currentOutstanding);
                const excess = parseFloat(order.finalAmount) - availCredit;
                
                return (
                  <div key={order.id} className="card animate-slide-in" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', borderLeft: '5px solid var(--danger)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{order.Retailer?.name}</h4>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Order Number: <strong>{order.orderNumber}</strong> | Placed By: <strong>{order.placedByRole.toUpperCase()}</strong>
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--danger)' }}>₹{parseFloat(order.finalAmount).toLocaleString()}</span>
                        <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-light)' }}>Order Value</span>
                      </div>
                    </div>

                    {/* Credit matrix stats */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px',
                      background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '0.75rem'
                    }}>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.6rem' }}>CREDIT LIMIT</span>
                        <strong>₹{parseFloat(order.Retailer?.creditLimit).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.6rem' }}>CURRENT OUTSTANDING</span>
                        <strong>₹{parseFloat(order.Retailer?.currentOutstanding).toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.6rem' }}>AVAILABLE CREDIT</span>
                        <strong style={{ color: 'var(--success)' }}>₹{availCredit.toLocaleString()}</strong>
                      </div>
                      <div>
                        <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '0.6rem' }}>EXCESS AMOUNT REQUESTED</span>
                        <strong style={{ color: 'var(--danger)' }}>₹{excess.toLocaleString()}</strong>
                      </div>
                    </div>

                    {/* Actions and note inputs */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px' }}>
                      <input 
                        type="text" 
                        placeholder="Add review or approval note here..."
                        className="form-control"
                        style={{ flex: 1 }}
                        value={creditApprovalNote}
                        onChange={(e) => setCreditApprovalNote(e.target.value)}
                      />
                      <button 
                        onClick={() => handleApproveCredit(order.id)}
                        className="btn btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--success)' }}
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <button 
                        onClick={() => handleRejectCredit(order.id)}
                        className="btn btn-danger"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                );
              })
            )}

          </div>
        )}

        {/* VIEW 3: RETAILERS MANAGEMENT */}
        {activeSubTab === 'retailers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Retailer Client Accounts</h3>
              <button 
                onClick={() => {
                  setEditingRetailerId(null);
                  setRetailerForm({ name: '', mobileNumber: '', email: '', password: '', category: 'T1', creditLimit: 0, assignedSalesmanId: '' });
                  setRetailerModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Register Retailer
              </button>
            </div>

            {/* Retailer Table */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th>Tier Category</th>
                    <th>Outstanding Dues</th>
                    <th>Credit Limit</th>
                    <th>Credit Period / Requests</th>
                    <th>Assigned Salesman</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {retailers.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        <div>{r.name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 500 }}>{r.email} | {r.mobileNumber}</div>
                      </td>
                      <td>
                        <span className="badge badge-info">{r.category}</span>
                      </td>
                      <td style={{ fontWeight: 'bold', color: parseFloat(r.currentOutstanding) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{parseFloat(r.currentOutstanding).toLocaleString()}
                      </td>
                      <td>₹{parseFloat(r.creditLimit).toLocaleString()}</td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontWeight: 600 }}>
                            {r.creditTermApproved === 'none' || !r.creditTermApproved ? 'COD' : r.creditTermApproved.replace('_', ' ').toUpperCase()}
                          </span>
                          {r.creditRequestStatus === 'pending' && (
                            <div style={{ padding: '6px', background: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '4px', marginTop: '2px' }}>
                              <span style={{ fontSize: '0.65rem', color: '#b45309', display: 'block', fontWeight: 'bold', marginBottom: '4px' }}>
                                Requested: {r.creditTermRequest.replace('_', ' ').toUpperCase()}
                              </span>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button 
                                  onClick={() => handleReviewCreditTerm(r.id, 'approved', r.creditTermRequest)}
                                  className="btn btn-primary"
                                  style={{ padding: '2px 6px', fontSize: '0.6rem', background: '#059669', border: 'none' }}
                                >
                                  Approve
                                </button>
                                <button 
                                  onClick={() => handleReviewCreditTerm(r.id, 'rejected')}
                                  className="btn btn-outline"
                                  style={{ padding: '2px 6px', fontSize: '0.6rem', color: '#dc2626', borderColor: '#dc2626' }}
                                >
                                  Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td>{r.Salesman ? r.Salesman.name : <em style={{ color: 'var(--text-light)' }}>None</em>}</td>
                      <td>
                        <span className={`badge ${r.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {r.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => {
                              setEditingRetailerId(r.id);
                              setRetailerForm({
                                name: r.name,
                                mobileNumber: r.mobileNumber,
                                email: r.email,
                                category: r.category,
                                creditLimit: r.creditLimit,
                                assignedSalesmanId: r.assignedSalesmanId || '',
                                isActive: r.isActive,
                                creditTermApproved: r.creditTermApproved || 'none',
                                creditRequestStatus: r.creditRequestStatus || 'none'
                              });
                              setRetailerModalOpen(true);
                            }}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteRetailer(r.id)}
                            className="btn btn-danger"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Retailer Modal form */}
            {retailerModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleSaveRetailer}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{editingRetailerId ? 'Edit Retailer Account' : 'Register New Retailer Account'}</h3>
                  
                  <div className="form-group">
                    <label>Retailer Name</label>
                    <input 
                      type="text" required className="form-control"
                      value={retailerForm.name}
                      onChange={(e) => setRetailerForm({ ...retailerForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                      type="tel" required className="form-control"
                      value={retailerForm.mobileNumber}
                      onChange={(e) => setRetailerForm({ ...retailerForm, mobileNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" required className="form-control"
                      value={retailerForm.email}
                      onChange={(e) => setRetailerForm({ ...retailerForm, email: e.target.value })}
                    />
                  </div>
                  {!editingRetailerId && (
                    <div className="form-group">
                      <label>Login Password</label>
                      <input 
                        type="password" required className="form-control"
                        value={retailerForm.password}
                        onChange={(e) => setRetailerForm({ ...retailerForm, password: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="form-group">
                    <label>Pricing Tier Category</label>
                    <select 
                      className="form-control"
                      value={retailerForm.category}
                      onChange={(e) => setRetailerForm({ ...retailerForm, category: e.target.value })}
                    >
                      <option value="T1">T1 (Lowest Price)</option>
                      <option value="T2">T2 (Medium Price)</option>
                      <option value="T3">T3 (Highest Price)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Credit Limit Allocation (₹)</label>
                    <input 
                      type="number" required className="form-control"
                      value={retailerForm.creditLimit}
                      onChange={(e) => setRetailerForm({ ...retailerForm, creditLimit: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Assigned Salesman</label>
                    <select 
                      className="form-control"
                      value={retailerForm.assignedSalesmanId}
                      onChange={(e) => setRetailerForm({ ...retailerForm, assignedSalesmanId: e.target.value })}
                    >
                      <option value="">No Assigned Salesman</option>
                      {salesmen.map(sm => (
                        <option key={sm.id} value={sm.id}>{sm.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Approved Credit Period</label>
                    <select 
                      className="form-control"
                      value={retailerForm.creditTermApproved || 'none'}
                      onChange={(e) => setRetailerForm({ ...retailerForm, creditTermApproved: e.target.value })}
                    >
                      <option value="none">No Credit (COD / UPI)</option>
                      <option value="due_7">7 Days Credit</option>
                      <option value="due_15">15 Days Credit</option>
                      <option value="due_30">30 Days Credit</option>
                    </select>
                  </div>
                  {editingRetailerId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" id="retActive"
                        checked={retailerForm.isActive}
                        onChange={(e) => setRetailerForm({ ...retailerForm, isActive: e.target.checked })}
                      />
                      <label htmlFor="retActive" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Account Active</label>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setRetailerModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* VIEW 4: SALESMEN MANAGEMENT */}
        {activeSubTab === 'salesmen' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Sales Representatives</h3>
              <button 
                onClick={() => {
                  setEditingSalesmanId(null);
                  setSalesmanForm({ name: '', mobileNumber: '', email: '', password: '' });
                  setSalesmanModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Register Salesman
              </button>
            </div>

            {/* Salesmen Table */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '12px 16px' }}>Name</th>
                    <th>Contact details</th>
                    <th>Assigned Retailers</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salesmen.map(sm => (
                    <tr key={sm.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>{sm.name}</td>
                      <td>{sm.email} | {sm.mobileNumber}</td>
                      <td>
                        <span className="badge badge-info">{sm.Retailers?.length || 0} Clients</span>
                      </td>
                      <td>
                        <span className={`badge ${sm.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {sm.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '6px', padding: '12px 0' }}>
                        <button 
                          onClick={() => {
                            setEditingSalesmanId(sm.id);
                            setSalesmanForm({ name: sm.name, mobileNumber: sm.mobileNumber, email: sm.email, isActive: sm.isActive });
                            setSalesmanModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            setTargetForm({ salesmanId: sm.id, targetOrders: 0, targetRevenue: 0, targetDuesCollected: 0 });
                            setTargetModalOpen(true);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          Configure Targets
                        </button>
                        <button 
                          onClick={() => handleDeleteSalesman(sm.id)}
                          className="btn btn-danger"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Salesman Modal */}
            {salesmanModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleSaveSalesman}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{editingSalesmanId ? 'Edit Salesman Profile' : 'Register New Salesman'}</h3>
                  
                  <div className="form-group">
                    <label>Full NameLabel</label>
                    <input 
                      type="text" required className="form-control"
                      value={salesmanForm.name}
                      onChange={(e) => setSalesmanForm({ ...salesmanForm, name: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input 
                      type="tel" required className="form-control"
                      value={salesmanForm.mobileNumber}
                      onChange={(e) => setSalesmanForm({ ...salesmanForm, mobileNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input 
                      type="email" required className="form-control"
                      value={salesmanForm.email}
                      onChange={(e) => setSalesmanForm({ ...salesmanForm, email: e.target.value })}
                    />
                  </div>
                  {!editingSalesmanId && (
                    <div className="form-group">
                      <label>Login Password</label>
                      <input 
                        type="password" required className="form-control"
                        value={salesmanForm.password}
                        onChange={(e) => setSalesmanForm({ ...salesmanForm, password: e.target.value })}
                      />
                    </div>
                  )}

                  {editingSalesmanId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input 
                        type="checkbox" id="smActive"
                        checked={salesmanForm.isActive}
                        onChange={(e) => setSalesmanForm({ ...salesmanForm, isActive: e.target.checked })}
                      />
                      <label htmlFor="smActive" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Account Active</label>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setSalesmanModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Target Modal */}
            {targetModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleSaveTargets}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Monthly Targets Setup</h3>
                  
                  <div className="form-group">
                    <label>Order Volume Target</label>
                    <input 
                      type="number" required className="form-control"
                      value={targetForm.targetOrders}
                      onChange={(e) => setTargetForm({ ...targetForm, targetOrders: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Revenue Target (₹)</label>
                    <input 
                      type="number" required className="form-control"
                      value={targetForm.targetRevenue}
                      onChange={(e) => setTargetForm({ ...targetForm, targetRevenue: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Dues Collection Target (₹)</label>
                    <input 
                      type="number" required className="form-control"
                      value={targetForm.targetDuesCollected}
                      onChange={(e) => setTargetForm({ ...targetForm, targetDuesCollected: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setTargetModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Target</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* VIEW: PRODUCT CATEGORIES */}
        {activeSubTab === 'categories' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Product Categories Management</h3>
              <button 
                onClick={() => {
                  setEditingCategoryId(null);
                  setCategoryForm({ name: '', imageUrl: '', sortOrder: 0 });
                  setCategoryModalOpen(true);
                }}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Plus size={16} /> Add Category
              </button>
            </div>

            {/* Categories Table */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '12px 16px', width: '50px' }}>Icon</th>
                    <th>Category Name</th>
                    <th>Sort Order</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{
                          width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden',
                          background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          border: '1px solid var(--border-color)'
                        }}>
                          {c.imageUrl ? (
                            <img src={resolveImageUrl(c.imageUrl, API_BASE)} alt={c.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <span style={{ fontSize: '1.2rem' }}>📂</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontWeight: 'bold' }}>{c.name}</td>
                      <td>{c.sortOrder}</td>
                      <td>
                        <span className={`badge ${c.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                          {c.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => {
                            setEditingCategoryId(c.id);
                            setCategoryForm({
                              name: c.name,
                              imageUrl: c.imageUrl || '',
                              sortOrder: c.sortOrder || 0
                            });
                            setCategoryModalOpen(true);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--danger)', borderColor: 'var(--danger)', marginLeft: '6px' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Category Modal */}
            {categoryModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleSaveCategory}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{editingCategoryId ? 'Edit Category' : 'Add New Category'}</h3>
                  
                  <div className="form-group">
                    <label>Category Name</label>
                    <input 
                      type="text" required className="form-control" 
                      value={categoryForm.name} 
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} 
                    />
                  </div>
                  <div className="form-group">
                    <label>Category Image</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="url" placeholder="https://..." className="form-control" 
                          value={categoryForm.imageUrl} 
                          onChange={(e) => setCategoryForm({ ...categoryForm, imageUrl: e.target.value })} 
                        />
                        {categoryForm.imageUrl && (
                          <img src={resolveImageUrl(categoryForm.imageUrl, API_BASE)} alt="Preview" style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }} onError={(e) => e.target.style.display='none'} />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Or Upload:</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          style={{ fontSize: '0.7rem' }}
                          onChange={(e) => handleFileUpload(e.target.files[0], (url) => setCategoryForm({ ...categoryForm, imageUrl: url }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Sort Order Index</label>
                    <input 
                      type="number" className="form-control" 
                      value={categoryForm.sortOrder} 
                      onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: parseInt(e.target.value) || 0 })} 
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setCategoryModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Category</button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: PRODUCT CATALOG */}
        {activeSubTab === 'products' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Hardware inventory Products</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => {
                    setStockForm({ productId: '', quantity: 0, reason: '' });
                    setStockModalOpen(true);
                  }}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  ⚙️ Adjust Stock Log
                </button>
                <button 
                  onClick={() => {
                    setEditingProductId(null);
                    setProductForm({ name: '', sku: '', brand: '', categoryId: '', description: '', priceT1: 0, priceT2: 0, priceT3: 0, stockQuantity: 0, lowStockThreshold: 5, isFeatured: false, imageUrl: '' });
                    setProductModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={16} /> Add Product
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text"
                placeholder="Search products by name, SKU, or brand..."
                className="form-control"
                style={{ maxWidth: '300px' }}
                value={productSearchQuery}
                onChange={(e) => setProductSearchQuery(e.target.value)}
              />
            </div>

            {/* Products Table */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '12px 16px', width: '50px' }}>Image</th>
                    <th>Product name / SKU</th>
                    <th>Brand</th>
                    <th>Stock status</th>
                    <th>T1 Price</th>
                    <th>T2 Price</th>
                    <th>T3 Price</th>
                    <th>Featured</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products
                    .filter(p => {
                      if (!productSearchQuery) return true;
                      const q = productSearchQuery.toLowerCase();
                      return (p.name || '').toLowerCase().includes(q) ||
                             (p.sku || '').toLowerCase().includes(q) ||
                             (p.brand || '').toLowerCase().includes(q);
                    })
                    .map(p => {
                      let stockBadge = 'badge-success';
                    if (p.stockQuantity === 0) stockBadge = 'badge-danger';
                    else if (p.stockQuantity <= p.lowStockThreshold) stockBadge = 'badge-warning';

                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: p.isActive === false ? 0.6 : 1 }}>
                        <td style={{ padding: '12px 16px', cursor: 'pointer' }} onClick={() => setSelectedProductDetails(p)}>
                          <div style={{
                            width: '44px', height: '44px', borderRadius: '6px', overflow: 'hidden',
                            background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                          }}>
                            {p.images && p.images[0] ? (
                              <img src={resolveImageUrl(p.images[0], API_BASE)} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span style={{ fontSize: '1.2rem' }}>📦</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 'bold', cursor: 'pointer' }} onClick={() => setSelectedProductDetails(p)}>
                          <div style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.name}
                            {p.isActive === false && (
                              <span className="badge badge-danger" style={{ fontSize: '0.55rem', padding: '1px 5px' }}>Deactivated</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 500 }}>SKU: {p.sku} | Cat: {p.ProductCategory?.name}</div>
                        </td>
                        <td>{p.brand}</td>
                        <td>
                          <span className={`badge ${stockBadge}`}>
                            {p.stockQuantity} Left
                          </span>
                        </td>
                        <td>₹{parseFloat(p.priceT1).toLocaleString()}</td>
                        <td>₹{parseFloat(p.priceT2).toLocaleString()}</td>
                        <td>₹{parseFloat(p.priceT3).toLocaleString()}</td>
                        <td>{p.isFeatured ? '⭐ Yes' : 'No'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => {
                                setEditingProductId(p.id);
                                setProductForm({
                                  name: p.name,
                                  sku: p.sku,
                                  brand: p.brand,
                                  categoryId: p.categoryId,
                                  description: p.description || '',
                                  priceT1: p.priceT1,
                                  priceT2: p.priceT2,
                                  priceT3: p.priceT3,
                                  stockQuantity: p.stockQuantity,
                                  lowStockThreshold: p.lowStockThreshold,
                                  isFeatured: p.isFeatured,
                                  imageUrl: (p.images && p.images[0]) || ''
                                });
                                setProductModalOpen(true);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleToggleProductActive(p.id, p.isActive, p.name)}
                              className="btn btn-outline"
                              style={{ 
                                padding: '4px 8px', fontSize: '0.7rem', 
                                color: p.isActive !== false ? '#d97706' : '#16a34a', 
                                borderColor: p.isActive !== false ? '#fef3c7' : '#dcfce7',
                                background: p.isActive !== false ? '#fffbeb' : '#f0fdf4'
                              }}
                            >
                              {p.isActive !== false ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => handleDeleteProduct(p.id, p.name)}
                              className="btn btn-outline"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', color: 'var(--danger)', borderColor: '#fecaca', background: '#fef2f2' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Product Modal */}
            {productModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleSaveProduct}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '90vh', overflowY: 'auto' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>{editingProductId ? 'Edit Product Details' : 'Add New Hardware Product'}</h3>
                  
                  <div className="form-group">
                    <label>Product Name</label>
                    <input type="text" required className="form-control" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label>SKU Code</label>
                      <input type="text" required className="form-control" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Brand</label>
                      <input type="text" required className="form-control" value={productForm.brand} onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select required className="form-control" value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}>
                      <option value="">Select Category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    <div className="form-group">
                      <label>T1 Price (₹)</label>
                      <input type="number" required className="form-control" value={productForm.priceT1} onChange={(e) => setProductForm({ ...productForm, priceT1: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>T2 Price (₹)</label>
                      <input type="number" required className="form-control" value={productForm.priceT2} onChange={(e) => setProductForm({ ...productForm, priceT2: parseFloat(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>T3 Price (₹)</label>
                      <input type="number" required className="form-control" value={productForm.priceT3} onChange={(e) => setProductForm({ ...productForm, priceT3: parseFloat(e.target.value) })} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div className="form-group">
                      <label>Initial Stock</label>
                      <input type="number" required className="form-control" disabled={!!editingProductId} value={productForm.stockQuantity} onChange={(e) => setProductForm({ ...productForm, stockQuantity: parseInt(e.target.value) })} />
                    </div>
                    <div className="form-group">
                      <label>Low Threshold</label>
                      <input type="number" required className="form-control" value={productForm.lowStockThreshold} onChange={(e) => setProductForm({ ...productForm, lowStockThreshold: parseInt(e.target.value) })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Product Image</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="url" 
                          placeholder="https://images.unsplash.com/..." 
                          className="form-control" 
                          value={productForm.imageUrl} 
                          onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} 
                        />
                        {productForm.imageUrl && (
                          <img 
                            src={resolveImageUrl(productForm.imageUrl, API_BASE)} 
                            alt="Preview" 
                            style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>Or Upload:</span>
                        <input 
                          type="file" 
                          accept="image/*"
                          style={{ fontSize: '0.7rem' }}
                          onChange={(e) => handleFileUpload(e.target.files[0], (url) => setProductForm({ ...productForm, imageUrl: url }))}
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <input type="checkbox" id="prodFeat" checked={productForm.isFeatured} onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })} />
                    <label htmlFor="prodFeat" style={{ fontSize: '0.75rem', cursor: 'pointer' }}>Mark Featured on Mobile Home</label>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setProductModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save</button>
                  </div>
                </form>
              </div>
            )}

            {/* Product Details Modal Window */}
            {selectedProductDetails && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.6)', zIndex: 1100, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <div 
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-primary" style={{ fontSize: '0.7rem', marginBottom: '4px' }}>SKU: {selectedProductDetails.sku}</span>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0' }}>{selectedProductDetails.name}</h2>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Brand: <strong>{selectedProductDetails.brand}</strong> | Category: <strong>{selectedProductDetails.ProductCategory?.name || 'Hardware'}</strong></p>
                    </div>
                    <button onClick={() => setSelectedProductDetails(null)} className="btn btn-outline" style={{ padding: '4px 8px', borderRadius: '50%' }}>✕</button>
                  </div>

                  {/* Enlarged Image Container */}
                  <div style={{
                    width: '100%', height: '260px', borderRadius: '12px', overflow: 'hidden',
                    background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border-color)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                  }}>
                    {selectedProductDetails.images && selectedProductDetails.images[0] ? (
                      <img src={resolveImageUrl(selectedProductDetails.images[0], API_BASE)} alt={selectedProductDetails.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '12px' }} />
                    ) : (
                      <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                        <span style={{ fontSize: '3rem' }}>📦</span>
                        <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>No high-res image link provided</div>
                      </div>
                    )}
                  </div>

                  {/* Pricing Tiers Grid */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '8px', color: 'var(--text-main)' }}>Tier Pricing Structure</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                      <div style={{ background: '#f0f9ff', padding: '10px', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#0369a1', fontWeight: 600 }}>T1 Retailer Price</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0284c7', marginTop: '2px' }}>₹{parseFloat(selectedProductDetails.priceT1).toLocaleString()}</div>
                      </div>
                      <div style={{ background: '#f0fdf4', padding: '10px', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#15803d', fontWeight: 600 }}>T2 Retailer Price</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#16a34a', marginTop: '2px' }}>₹{parseFloat(selectedProductDetails.priceT2).toLocaleString()}</div>
                      </div>
                      <div style={{ background: '#faf5ff', padding: '10px', borderRadius: '8px', border: '1px solid #e9d5ff', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#6b21a8', fontWeight: 600 }}>T3 Retailer Price</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#9333ea', marginTop: '2px' }}>₹{parseFloat(selectedProductDetails.priceT3).toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Inventory & Specifications */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Stock Level:</span>
                      <strong style={{ fontSize: '0.85rem', marginLeft: '6px', color: selectedProductDetails.stockQuantity <= selectedProductDetails.lowStockThreshold ? 'var(--danger)' : 'var(--success)' }}>
                        {selectedProductDetails.stockQuantity} units available
                      </strong>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>Status:</span>
                      <strong style={{ fontSize: '0.85rem', marginLeft: '6px', color: selectedProductDetails.isActive !== false ? 'var(--success)' : 'var(--danger)' }}>
                        {selectedProductDetails.isActive !== false ? '🟢 Active in Catalog' : '🔴 Deactivated'}
                      </strong>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '4px', color: 'var(--text-main)' }}>Product Description & Details</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                      {selectedProductDetails.description || 'Official genuine hardware component backed by comprehensive brand warranty and distributor support.'}
                    </p>
                  </div>

                  {/* Verified Customer Reviews */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Verified Distributor Reviews</h4>
                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        ⭐ 4.9 / 5.0 Rating
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <strong>Tech Solutions Retailers Ltd</strong>
                          <span style={{ color: '#d97706' }}>⭐⭐⭐⭐⭐ 5.0</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>"Fast moving stock item. High build quality and great retailer margins!"</p>
                      </div>
                      <div style={{ background: '#f9fafb', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                          <strong>Apex Computer Systems</strong>
                          <span style={{ color: '#d97706' }}>⭐⭐⭐⭐⭐ 4.8</span>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>"Authentic brand hardware. Zero return rate across 50+ units sold."</p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => setSelectedProductDetails(null)} className="btn btn-secondary" style={{ width: '100%', padding: '10px', fontWeight: 'bold', marginTop: '8px' }}>Close Window</button>
                </div>
              </div>
            )}

            {/* Stock Adjustment Modal */}
            {stockModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleAdjustStock}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Log Stock Adjustment</h3>
                  
                  <div className="form-group">
                    <label>Select Product</label>
                    <select required className="form-control" value={stockForm.productId} onChange={(e) => setStockForm({ ...stockForm, productId: e.target.value })}>
                      <option value="">Select Item...</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quantity Change (Use negative to deduct)</label>
                    <input type="number" placeholder="e.g. 20 or -15" required className="form-control" value={stockForm.quantity} onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label>Adjustment Reason Note</label>
                    <input type="text" placeholder="e.g. Received shipment, Damaged stock" required className="form-control" value={stockForm.reason} onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })} />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setStockModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Adjust stock</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* VIEW 6: ORDERS LIST */}
        {activeSubTab === 'orders' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Distributor Sales Orders</h3>
            
            {/* Orders Table */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '12px 16px' }}>Order ID / Date</th>
                    <th>Retailer</th>
                    <th>Payment</th>
                    <th>Final Amount</th>
                    <th>Status Action</th>
                    <th>Credit Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        <div>{o.orderNumber}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 500 }}>
                          Placed: {new Date(o.placedAt).toLocaleString()}
                        </div>
                      </td>
                      <td>{o.Retailer?.name}</td>
                      <td>{o.paymentType.toUpperCase()}</td>
                      <td style={{ fontWeight: 'bold' }}>₹{parseFloat(o.finalAmount).toLocaleString()}</td>
                      <td>
                        <select 
                          value={o.status}
                          disabled={o.status === 'cancelled' || o.status === 'pending_approval'}
                          onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                          style={{
                            padding: '4px', fontSize: '0.75rem', borderRadius: '4px',
                            border: '1px solid var(--border-color)', outline: 'none'
                          }}
                        >
                          <option value="pending" disabled>Pending</option>
                          <option value="pending_approval" disabled>Awaiting Credit</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="packed">Packed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td>
                        <span className={`badge ${o.creditApprovalStatus === 'approved' ? 'badge-success' : (o.creditApprovalStatus === 'rejected' ? 'badge-danger' : 'badge-info')}`}>
                          {o.creditApprovalStatus.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => setSelectedInvoice(o)}
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <FileText size={12} />
                          Invoice
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* HTML Invoice Modal (Simulated PDF) */}
            {selectedInvoice && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <div className="card animate-slide-in" style={{ width: '100%', maxWidth: '640px', background: 'white', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  
                  {/* Invoice Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '10px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>BISWAS DISTRIBUTION</h2>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)', display: 'block' }}>Corporate Hardware & CCTV Supplies</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>GSTIN: 29BISWASD1212Z1</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>TAX INVOICE</h3>
                      <span style={{ fontSize: '0.75rem', display: 'block' }}>Invoice No: <strong>INV-{selectedInvoice.orderNumber}</strong></span>
                      <span style={{ fontSize: '0.75rem' }}>Date: <strong>{new Date(selectedInvoice.placedAt).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  {/* Billing Details Address */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '0.75rem' }}>
                    <div>
                      <strong style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>BILL TO:</strong>
                      <strong>{selectedInvoice.Retailer?.name}</strong>
                      <span style={{ display: 'block' }}>Email: {selectedInvoice.Retailer?.email}</span>
                      <span>Mobile: {selectedInvoice.Retailer?.mobileNumber}</span>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--text-light)', display: 'block', marginBottom: '4px' }}>DELIVER TO ADDRESS:</strong>
                      <span>{selectedInvoice.deliveryAddressSnapshot?.addressLine1}</span>
                      <span style={{ display: 'block' }}>{selectedInvoice.deliveryAddressSnapshot?.city}, {selectedInvoice.deliveryAddressSnapshot?.state} - {selectedInvoice.deliveryAddressSnapshot?.pincode}</span>
                    </div>
                  </div>

                  {/* Items Breakdown Table */}
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem', marginTop: '10px' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #000', textAlign: 'left', fontWeight: 'bold' }}>
                        <th style={{ padding: '8px' }}>Product SKU</th>
                        <th>Product name</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th style={{ textAlign: 'right', paddingRight: '8px' }}>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedInvoice.OrderItems?.map(item => (
                        <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '8px', fontFamily: 'monospace' }}>{item.sku}</td>
                          <td>{item.productName}</td>
                          <td>₹{parseFloat(item.unitPrice).toLocaleString()}</td>
                          <td>{item.quantity}</td>
                          <td style={{ textAlign: 'right', paddingRight: '8px', fontWeight: 'bold' }}>₹{parseFloat(item.subtotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Invoice Surcharges & CGST/SGST Tax Calculation */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                    <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Items Value:</span>
                        <span>₹{parseFloat(selectedInvoice.totalProductAmount).toLocaleString()}</span>
                      </div>
                      
                      {/* Surcharge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Surcharge Fee ({selectedInvoice.paymentType.toUpperCase()}):</span>
                        <span>₹{parseFloat(selectedInvoice.surchargeAmount).toLocaleString()}</span>
                      </div>

                      {/* Simulated GST (18% inclusive) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)' }}>
                        <span>SGST (9%):</span>
                        <span>₹{(parseFloat(selectedInvoice.totalProductAmount) * 0.09).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-light)', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>
                        <span>CGST (9%):</span>
                        <span>₹{(parseFloat(selectedInvoice.totalProductAmount) * 0.09).toFixed(2)}</span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--primary)' }}>
                        <span>Total Amount Due:</span>
                        <span>₹{parseFloat(selectedInvoice.finalAmount).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer Controls */}
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
                    <button 
                      onClick={() => onNotification('success', 'PDF Invoice Download Triggered!')}
                      className="btn btn-outline"
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <Download size={14} /> Download PDF
                    </button>
                    <button onClick={() => setSelectedInvoice(null)} className="btn btn-primary" style={{ flex: 1 }}>Close Invoice</button>
                  </div>

                </div>
              </div>
            )}

          </div>
        )}

        {/* VIEW 7: ACCOUNT RECEIVABLES (DUES LEDGER) */}
        {activeSubTab === 'dues' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Accounts Receivables & Outstanding Ledger</h3>
            
            {/* Dues Table */}
            <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-light)' }}>
                    <th style={{ padding: '12px 16px' }}>Bill ID / Order No</th>
                    <th>Retailer Account</th>
                    <th>Due Date</th>
                    <th>Total Due</th>
                    <th>Paid Amount</th>
                    <th>Remaining Balance</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dues.map(due => (
                    <tr key={due.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 'bold' }}>
                        <div>DP-00{due.id}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-light)', fontWeight: 500 }}>
                          Order: {due.Order?.orderNumber}
                        </div>
                      </td>
                      <td>{due.Retailer?.name}</td>
                      <td>{new Date(due.dueDate).toLocaleDateString()}</td>
                      <td>₹{parseFloat(due.totalDue).toLocaleString()}</td>
                      <td>₹{parseFloat(due.paidAmount).toLocaleString()}</td>
                      <td style={{ fontWeight: 'bold', color: parseFloat(due.balanceDue) > 0 ? 'var(--danger)' : 'var(--success)' }}>
                        ₹{parseFloat(due.balanceDue).toLocaleString()}
                      </td>
                      <td>
                        <span className={`badge ${due.status === 'paid' ? 'badge-success' : (due.status === 'overdue' ? 'badge-danger' : 'badge-warning')}`}>
                          {due.status.toUpperCase()}
                        </span>
                      </td>
                      <td>
                        {due.status !== 'paid' && (
                          <button 
                            onClick={() => {
                              setPaymentForm({ dueId: due.id, amountReceived: parseFloat(due.balanceDue), note: '' });
                              setPaymentModalOpen(true);
                            }}
                            className="btn btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                          >
                            Record Payment
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Offline Payment Recording Modal */}
            {paymentModalOpen && (
              <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex',
                alignItems: 'center', justifyContent: 'center', padding: '20px'
              }}>
                <form 
                  onSubmit={handleRecordPayment}
                  className="card animate-slide-in"
                  style={{ width: '100%', maxWidth: '360px', display: 'flex', flexDirection: 'column', gap: '8px' }}
                >
                  <h3 style={{ fontSize: '1rem', fontWeight: 'bold' }}>Record Offline Collection</h3>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-light)' }}>This payment will reduce the outstanding due and increase the retailer's available credit balance.</p>
                  
                  <div className="form-group">
                    <label>Amount Received (₹)</label>
                    <input 
                      type="number" required className="form-control"
                      value={paymentForm.amountReceived}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amountReceived: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Payment Notes / Transaction ID</label>
                    <input 
                      type="text" placeholder="e.g. Cash collected by Salesman 1, Bank Transfer" className="form-control"
                      value={paymentForm.note}
                      onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                    <button type="button" onClick={() => setPaymentModalOpen(false)} className="btn btn-outline" style={{ flex: 1 }}>Cancel</button>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Record Payment</button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* VIEW 8: GENERAL CONFIG OPTIONS */}
        {activeSubTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>Global Payment Arrangement &amp; Surcharge Configs</h3>
            
            <form onSubmit={handleSaveConfigs} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="form-group">
                <label>Cash on Delivery (COD) Flat Charge (₹)</label>
                <input 
                  type="number" className="form-control"
                  value={codCharge}
                  onChange={(e) => setCodCharge(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Due 7 Days Surcharge Rate (%)</label>
                <input 
                  type="number" step="0.1" className="form-control"
                  value={due7Rate}
                  onChange={(e) => setDue7Rate(parseFloat(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label>Due 15 Days Surcharge Rate (%)</label>
                <input 
                  type="number" step="0.1" className="form-control"
                  value={due15Rate}
                  onChange={(e) => setDue15Rate(parseFloat(e.target.value))}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', padding: '10px 20px', fontWeight: 'bold' }}>
                Save Configuration Updates
              </button>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
