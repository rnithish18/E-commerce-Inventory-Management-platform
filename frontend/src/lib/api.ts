import axios from 'axios'

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // Do not redirect on /auth/me checks (which just detects guest status)
      const isMeCheck = err.config?.url?.includes('/auth/me');
      const path = window.location.pathname;
      if (!isMeCheck && path !== '/login' && path !== '/register') {
        window.location.href = `/login?returnUrl=${encodeURIComponent(path)}`;
      }
    }
    return Promise.reject(err)
  }
)

export { api }
export default api

// ── Auth ──
export const authApi = {
  register: (data: { email: string; password: string; full_name: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string; rememberMe?: boolean }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (data: { email: string }) =>
    api.post('/auth/forgot-password', data),
  resetPassword: (data: { token: string; password: string }) =>
    api.post('/auth/reset-password', data),
  getProviders: () =>
    api.get<{ providers: { google: boolean } }>('/auth/providers'),
}

// ── Products ──
export interface ProductListParams {
  page?: number; limit?: number; search?: string; category?: string;
  min_price?: number; max_price?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'discount_desc';
  in_stock?: 'true' | 'false';
}
export const productsApi = {
  list: (params?: ProductListParams) => api.get('/products', { params }),
  featured: () => api.get('/products/featured'),
  detail: (slug: string) => api.get(`/products/${slug}`),
}

// ── Categories ──
export const categoriesApi = {
  list: () => api.get('/categories'),
}
