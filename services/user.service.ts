import { apiClient, ApiResponse } from '@/lib/api-client';
import { User, PaginatedResponse } from '@/types';

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: 'USER' | 'ADMIN';
  isActive?: boolean;
}

export const userService = {
  async getAll(query?: UserQuery): Promise<PaginatedResponse<User>> {
    const response = await apiClient.get<ApiResponse<User[]>>('/users', {
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

  async getById(id: string): Promise<User> {
    const response = await apiClient.get<ApiResponse<User>>(`/users/${id}`);
    return response.data.data;
  },

  async update(id: string, data: UpdateUserDto): Promise<User> {
    const response = await apiClient.patch<ApiResponse<User>>(`/users/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
