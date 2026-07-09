const getLocalApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  if (window.location.port === '8081') {
    return 'http://localhost:5001';
  }
  return 'http://localhost:5000';
};

const isCapacitor = typeof window !== 'undefined' && (
  !!window.Capacitor || 
  window.location.protocol === 'capacitor:' || 
  (window.location.hostname === 'localhost' && window.location.port === '')
);

export const API_BASE = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (isCapacitor
     ? 'https://billing.abpseeds.com'
     : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? getLocalApiUrl()
        : 'https://billing.abpseeds.com'));

export const resolveImageUrl = (url, activeBaseUrl) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  const baseUrl = activeBaseUrl || API_BASE;
  
  // If the URL contains /uploads/ (relative or absolute), convert it to use current baseUrl with /api prefix
  if (url.includes('/uploads/')) {
    const idx = url.indexOf('/uploads/');
    const filename = url.substring(idx + 9); // length of '/uploads/'
    return `${baseUrl}/api/uploads/${filename}`;
  }
  
  if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1') || url.startsWith('http://10.0.2.2')) {
    try {
      const parsed = new URL(url);
      return `${baseUrl}${parsed.pathname}`;
    } catch (e) {
      return url;
    }
  }
  
  return url;
};
