import axios from 'axios';

const api = axios.create({
  baseURL: 'https://pms-real.onrender.com',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  }
});

// Interceptor to inject Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('pms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Use Bearer strategy for APIs
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
