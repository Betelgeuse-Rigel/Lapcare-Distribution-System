export const API_BASE = import.meta.env.VITE_API_URL !== undefined 
  ? import.meta.env.VITE_API_URL 
  : 'https://billing.abpseeds.com';

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
