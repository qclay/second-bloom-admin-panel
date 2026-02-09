import { apiClient, ApiResponse } from '@/lib/api-client';

export interface Size {
  id: string;
  name: string;
  slug: string;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

export const sizeService = {
  async getAll(query?: { page?: number; limit?: number }): Promise<PaginatedResponse<Size>> {
    const response = await apiClient.get<ApiResponse<Size[] | { data: Size[]; meta?: { pagination?: Record<string, unknown> } }>>('/sizes', {
      params: query ?? { limit: 100 },
    });
    const defaultPagination = {
      page: 1,
      limit: 100,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    const raw = response.data.data;
    const data = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: Size[] }).data) ? (raw as { data: Size[] }).data : []);
    const pagination = response.data.meta?.pagination ?? (raw && typeof raw === 'object' && 'meta' in raw ? (raw as { meta?: { pagination?: Record<string, unknown> } }).meta?.pagination : undefined) ?? defaultPagination;
    return {
      data,
      meta: { pagination: { ...defaultPagination, ...pagination } },
    };
  },
};
