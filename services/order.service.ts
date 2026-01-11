import { apiClient, ApiResponse } from '@/lib/api-client';
import { Order, PaginatedResponse, OrderStatus } from '@/types';

export interface OrderQuery {
  page?: number;
  limit?: number;
  status?: string;
  buyerId?: string;
  sellerId?: string;
}

export interface UpdateOrderStatusDto {
  status: OrderStatus;
}

export const orderService = {
  async getAll(query?: OrderQuery): Promise<PaginatedResponse<Order>> {
    const response = await apiClient.get<ApiResponse<Order[]>>('/orders', {
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

  async getById(id: string): Promise<Order> {
    const response = await apiClient.get<ApiResponse<Order>>(`/orders/${id}`);
    return response.data.data;
  },

  async updateStatus(id: string, data: UpdateOrderStatusDto): Promise<Order> {
    const response = await apiClient.patch<ApiResponse<Order>>(`/orders/${id}/status`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/orders/${id}`);
  },
};
