import axios from 'axios';

// In local dev, Vite proxies '/api' to the backend (see vite.config.js).
// In production both frontend and backend are served from the same Vercel
// deployment (see vercel.json), so the relative '/api' path just works.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({ baseURL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('polar_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('polar_token');
      localStorage.removeItem('polar_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default client;
