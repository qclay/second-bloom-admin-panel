import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { toast } from 'sonner';
import { useLocaleStore } from '@/lib/locale-store';
import { useAuthStore } from '@/lib/auth-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const READ_METHODS = ['get', 'head', 'options'];

apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const role = useAuthStore.getState().user?.role;
      const method = (config.method || 'get').toLowerCase();
      const isAuthCall = (config.url || '').startsWith('/auth');
      if (role === 'FINANCIST' && !READ_METHODS.includes(method) && !isAuthCall) {
        toast.error('Read-only access: this action is not allowed for your role.');
        return Promise.reject(
          new axios.Cancel('Blocked: FINANCIST role is read-only'),
        );
      }
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const locale = useLocaleStore.getState().locale;
      const lang = locale === 'ru' || locale === 'uz' ? locale : 'en';
      config.headers['Accept-Language'] = lang;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    const errorData = error.response?.data as ApiError | undefined;
    
    // Check if token was explicitly revoked
    const isTokenRevoked = 
      errorData?.error?.code === 'TOKEN_REVOKED' || 
      errorData?.error?.code === 'REFRESH_TOKEN_REVOKED';

    if (isTokenRevoked) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const isAuthError = 
      error.response?.status === 401 || 
      (error.response?.status === 403 && 
       errorData?.error?.code === 'FORBIDDEN' && 
       ['Authentication required', 'Требуется аутентификация', 'Autentifikatsiya talab qilinadi'].includes(errorData?.error?.message || ''));

    if (isAuthError && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          }

          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{
      field?: string;
      message: string;
      code: string;
    }>;
    documentation?: string;
  };
  statusCode: number;
  timestamp: string;
  path: string;
  requestId: string;
  retry?: {
    retryable: boolean;
    retryAfter?: number;
  };
}
