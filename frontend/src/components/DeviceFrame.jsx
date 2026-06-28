import React from 'react';
import { 
  Wifi, Battery, Signal, ArrowLeft, ShoppingCart, 
  Home, BookOpen, FileText, IndianRupee, User,
  Users, BarChart3, Bell, Power
} from 'lucide-react';

export default function DeviceFrame({ 
  children, 
  title, 
  onBack, 
  cartCount, 
  onCartClick, 
  currentTab, 
  onTabChange, 
  role,
  onLogout,
  showNavbar = true
}) {
  // Format current system time for the status bar
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Navigation Items by Role
  const retailerTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'products', label: 'Products', icon: BookOpen },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'dues', label: 'Dues', icon: IndianRupee },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const salesmanTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'retailers', label: 'Retailers', icon: Users },
    { id: 'orders', label: 'Orders', icon: FileText },
    { id: 'dues', label: 'Dues', icon: IndianRupee },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  const activeTabs = role === 'salesman' ? salesmanTabs : retailerTabs;

  return (
    <div className="device-frame animate-fade-in">
      {/* Phone Notch */}
      <div className="device-notch">
        <div className="device-speaker"></div>
        <div className="device-camera"></div>
      </div>

      {/* Android Status Bar */}
      <div className="device-status-bar">
        <span>{timeStr}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Signal size={12} />
          <Wifi size={12} />
          <Battery size={12} />
        </div>
      </div>

      {/* Screen Content Wrapper */}
      <div className="device-screen">
        
        {/* App Bar (Header) - Only show if not on splash/login */}
        {title && (
          <div style={{
            background: 'var(--primary)',
            color: 'white',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {onBack ? (
                <button 
                  onClick={onBack}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}
                >
                  <ArrowLeft size={20} />
                </button>
              ) : null}
              <h2 style={{ color: 'white', fontSize: '1rem', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                {title}
              </h2>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Cart Icon (Retailer context) */}
              {role === 'retailer' && onCartClick && (
                <button 
                  onClick={onCartClick}
                  style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', position: 'relative' }}
                >
                  <ShoppingCart size={20} />
                  {cartCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-8px',
                      background: 'var(--danger)',
                      color: 'white',
                      fontSize: '0.65rem',
                      fontWeight: 'bold',
                      borderRadius: '50%',
                      padding: '2px 5px',
                      minWidth: '16px',
                      textAlign: 'center'
                    }}>
                      {cartCount}
                    </span>
                  )}
                </button>
              )}

              {/* Power / Logout icon */}
              {onLogout && (
                <button 
                  onClick={onLogout}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer' }}
                  title="Logout"
                >
                  <Power size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Children Screen Area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>

        {/* Bottom Navigation Bar */}
        {showNavbar && currentTab && (
          <div style={{
            background: 'white',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-around',
            padding: '6px 0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
          }}>
            {activeTabs.map(tab => {
              const TabIcon = tab.icon;
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '2px',
                    color: isActive ? 'var(--primary)' : 'var(--text-light)',
                    fontSize: '0.7rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    flex: 1,
                    transition: 'var(--transition-fast)'
                  }}
                >
                  <TabIcon size={18} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Phone Navigation Bar */}
      <div className="device-nav-bar">
        <div className="device-nav-button" onClick={onBack}></div>
      </div>
    </div>
  );
}
