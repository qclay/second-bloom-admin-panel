import { apiClient, ApiResponse } from '@/lib/api-client';
import { User, PaginatedResponse } from '@/types';

export interface UserQuery {
  page?: number;
  limit?: number;
  search?: string;
  telegramChatId?: string;
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
    const raw = response.data.meta as Record<string, unknown> | undefined;
    const pagination = raw?.pagination as Record<string, unknown> | undefined ?? raw;
    const page = Number(pagination?.page ?? 1);
    const totalPages = Number(pagination?.totalPages ?? 0);
    return {
      data: response.data.data,
      meta: {
        pagination: {
          page,
          limit: Number(pagination?.limit ?? 20),
          total: Number(pagination?.total ?? 0),
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
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

  async addPublicationCredits(userId: string, quantity: number): Promise<User> {
    const response = await apiClient.post<ApiResponse<User>>(
      `/users/${userId}/publication-credits`,
      { quantity }
    );
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/users/${id}`);
  },
};
