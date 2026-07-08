const getLocalApiUrl = () => {
  if (typeof window === 'undefined') return 'http://localhost:5000';
  if (window.location.port === '8081') {
    return 'http://localhost:5001';
  }
  return 'http://localhost:5000';
};

export const API_BASE = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : (typeof window !== 'undefined' && window.Capacitor
     ? 'https://billing.abpseeds.com'
     : (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? getLocalApiUrl()
        : 'https://billing.abpseeds.com'));

export const resolveImageUrl = (url, activeBaseUrl) => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  const baseUrl = activeBaseUrl || API_BASE;
  
  if (url.startsWith('/uploads/')) {
    return `${baseUrl}${url}`;
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
