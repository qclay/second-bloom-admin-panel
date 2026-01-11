import { apiClient, ApiResponse } from '@/lib/api-client';
import { Category, PaginatedResponse } from '@/types';

export interface CreateCategoryDto {
  name: string;
  description?: string;
  imageId?: string;
  parentId?: string;
  isActive?: boolean;
  order?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  description?: string;
  imageId?: string;
  parentId?: string;
  isActive?: boolean;
  order?: number;
}

export interface CategoryQuery {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentId?: string | null;
  includeChildren?: boolean;
}

export const categoryService = {
  async getAll(query?: CategoryQuery): Promise<PaginatedResponse<Category>> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories', {
      params: query,
    });
    const defaultPagination = { 
      page: 1, 
      limit: 20, 
      total: 0, 
      totalPages: 0, 
      hasNextPage: false, 
      hasPreviousPage: false 
    };
    return {
      data: response.data.data,
      meta: {
        pagination: response.data.meta?.pagination || defaultPagination,
      },
    };
  },

  async getById(id: string, includeChildren = false): Promise<Category> {
    const response = await apiClient.get<ApiResponse<Category>>(`/categories/${id}`, {
      params: { includeChildren },
    });
    return response.data.data;
  },

  async getRoots(): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>('/categories/roots');
    return response.data.data;
  },

  async getChildren(parentId: string): Promise<Category[]> {
    const response = await apiClient.get<ApiResponse<Category[]>>(`/categories/${parentId}/children`);
    return response.data.data;
  },

  async create(data: CreateCategoryDto): Promise<Category> {
    const response = await apiClient.post<ApiResponse<Category>>('/categories', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateCategoryDto): Promise<Category> {
    const response = await apiClient.patch<ApiResponse<Category>>(`/categories/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};
