const trimSlash = (value: string) => value.replace(/\/+$/, '');

const getBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return trimSlash(configured);
  // In local dev, Vite proxy maps /api -> backend target.
  return '/api';
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
};

