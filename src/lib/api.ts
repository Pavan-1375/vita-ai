const trimSlash = (value: string) => value.replace(/\/+$/, '');

const getBaseUrl = () => {
  return 'https://web-production-fec62.up.railway.app';
};

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getBaseUrl()}${normalizedPath}`;
};