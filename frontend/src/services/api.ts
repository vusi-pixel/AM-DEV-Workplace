import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Standardize error message extraction
    const responseData = error.response?.data as { message?: string; errors?: Array<{ field: string; message: string }> } | undefined;
    const message = responseData?.message || error.message || 'An unexpected error occurred';
    
    // Auto-detect session expiry / unauthorized on non-login endpoints
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Allow auth context to handle redirect
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(new Error(message));
  }
);

export default api;
