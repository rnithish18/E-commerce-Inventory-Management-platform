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
    api.get<{
      google: boolean;
      facebook: boolean;
      github: boolean;
      phone: boolean;
      magicLink: boolean;
      googleClientId?: string;
      providers: {
        google: boolean;
        facebook: boolean;
        github: boolean;
        phone: boolean;
        magicLink: boolean;
      };
    }>('/auth/providers'),
  verifyGoogleCredential: (credential: string, returnUrl?: string) =>
    api.post('/auth/google/credential', { credential, returnUrl }),
  sendPhoneOtp: (phone: string) =>
    api.post('/auth/phone/send-otp', { phone }),
  verifyPhoneOtp: (phone: string, code: string, returnUrl?: string) =>
    api.post('/auth/phone/verify-otp', { phone, code, returnUrl }),
  sendMagicLink: (email: string, returnUrl?: string) =>
    api.post('/auth/magic-link/send', { email, returnUrl }),
  verifyMagicLink: (token: string, returnUrl?: string) =>
    api.post('/auth/magic-link/verify', { token, returnUrl }),
  getIdentities: () =>
    api.get<{
      hasPassword: boolean;
      email: string | null;
      phone: string | null;
      identities: Array<{
        provider: string;
        provider_user_id: string;
        email: string | null;
        created_at: string;
      }>;
    }>('/auth/identities'),
  disconnectIdentity: (provider: string) =>
    api.post(`/auth/identities/${provider}/disconnect`),
  setPassword: (password: string) =>
    api.post('/auth/set-password', { password }),
}

// ── Uploads & AI ──
export const uploadsApi = {
  uploadImage: (formData: FormData) =>
    api.post<{
      success: boolean;
      url: string;
      thumbUrl: string;
      filename: string;
      hash: string;
      originalName: string;
      size: number;
      width: number;
      height: number;
    }>('/uploads/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  uploadImages: (formData: FormData) =>
    api.post<{
      success: boolean;
      count: number;
      images: Array<{
        url: string;
        thumbUrl: string;
        filename: string;
        hash: string;
        originalName: string;
        size: number;
      }>;
    }>('/uploads/images', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export interface AiAnalysisData {
  suggestedTitle: string;
  suggestedCategory: string;
  suggestedDescription: string;
  detectedTags: string[];
  dominantColors: string[];
  estimatedPriceRange: {
    minPaise: number;
    maxPaise: number;
    currency: 'INR';
  };
  imageQualityScore: number;
  recommendations: string[];
  cached?: boolean;
}

export const aiApi = {
  analyzeImage: (data: { imageUrl?: string; filenameHint?: string } | FormData) => {
    if (data instanceof FormData) {
      return api.post<{ success: boolean; data: AiAnalysisData }>('/ai/analyze-image', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post<{ success: boolean; data: AiAnalysisData }>('/ai/analyze-image', data);
  },
  imageSearch: (data: { imageUrl?: string; filenameHint?: string } | FormData) => {
    if (data instanceof FormData) {
      return api.post<{
        success: boolean;
        queryAnalysis: { category: string; tags: string[]; title: string };
        count: number;
        results: any[];
      }>('/ai/image-search', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post<{
      success: boolean;
      queryAnalysis: { category: string; tags: string[]; title: string };
      count: number;
      results: any[];
    }>('/ai/image-search', data);
  },
};

// ── Products ──
export interface ProductListParams {
  page?: number; limit?: number; search?: string; category?: string;
  brand?: string; brands?: string;
  min_price?: number; max_price?: number;
  rating?: number; discount?: number;
  sort?: 'price_asc' | 'price_desc' | 'rating_desc' | 'newest' | 'discount_desc';
  in_stock?: 'true' | 'false';
}

export interface SuggestionItem {
  id: string;
  name: string;
  slug: string;
  brand: string;
  category_name: string;
  price_paise: number;
  image_url: string | null;
  score: number;
}

export interface CatalogFilters {
  brands: Array<{ name: string; count: number }>;
  priceRange: { min_paise: number; max_paise: number };
  categories: Array<{ id: string; name: string; slug: string; count: number }>;
}

export const productsApi = {
  list: (params?: ProductListParams) => api.get('/products', { params }),
  featured: () => api.get('/products/featured'),
  detail: (slug: string) => api.get(`/products/${slug}`),
  suggest: (q: string) => api.get<{ suggestions: SuggestionItem[] }>('/products/suggest', { params: { q } }),
  filters: () => api.get<CatalogFilters>('/products/filters'),
}

// ── Reviews ──
export const reviewsApi = {
  submit: (data: {
    product_id: string;
    order_item_id: string;
    rating: number;
    title: string;
    body: string;
    images?: string[];
  }) => api.post('/reviews', data),
  toggleHelpful: (reviewId: string) =>
    api.post<{ helpful: boolean; helpful_count: number }>(`/reviews/${reviewId}/helpful`),
}

// ── Invoices ──
export const ordersApi = {
  getInvoiceUrl: (orderId: string) => `/api/v1/orders/${orderId}/invoice`,
}

// ── Categories ──
export const categoriesApi = {
  list: () => api.get('/categories'),
}
