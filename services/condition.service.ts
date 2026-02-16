import { apiClient, ApiResponse } from '@/lib/api-client';

export interface Condition {
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

export interface CreateConditionDto {
  name: { en: string; ru?: string; uz?: string };
}

export interface UpdateConditionDto {
  name?: { en?: string; ru?: string; uz?: string };
}

export const conditionService = {
  async getAll(query?: { page?: number; limit?: number }): Promise<PaginatedResponse<Condition>> {
    const response = await apiClient.get<ApiResponse<Condition[] | { data: Condition[]; meta?: { pagination?: Record<string, unknown> } }>>('/conditions', {
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
    const data = Array.isArray(raw) ? raw : (raw && typeof raw === 'object' && 'data' in raw && Array.isArray((raw as { data: Condition[] }).data) ? (raw as { data: Condition[] }).data : []);
    const pagination = response.data.meta?.pagination ?? (raw && typeof raw === 'object' && 'meta' in raw ? (raw as { meta?: { pagination?: Record<string, unknown> } }).meta?.pagination : undefined) ?? defaultPagination;
    return {
      data,
      meta: { pagination: { ...defaultPagination, ...pagination } },
    };
  },

  async create(data: CreateConditionDto): Promise<Condition> {
    const response = await apiClient.post<ApiResponse<Condition>>('/conditions', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateConditionDto): Promise<Condition> {
    const response = await apiClient.patch<ApiResponse<Condition>>(`/conditions/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/conditions/${id}`);
  },
};
