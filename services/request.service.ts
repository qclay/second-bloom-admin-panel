import { apiClient, ApiResponse } from '@/lib/api-client';
import { BouquetRequest, BouquetRequestStatus, PaginatedResponse } from '@/types';

export interface RequestQuery {
  page?: number;
  limit?: number;
  status?: BouquetRequestStatus;
  buyerId?: string;
}

export const requestService = {
  async getAll(query?: RequestQuery): Promise<PaginatedResponse<BouquetRequest>> {
    const response = await apiClient.get<ApiResponse<BouquetRequest[]>>('/requests', {
      params: query,
    });
    const defaultPagination = {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNextPage: false,
      hasPreviousPage: false,
    };
    return {
      data: response.data.data,
      meta: {
        pagination: response.data.meta?.pagination || defaultPagination,
      },
    };
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/requests/${id}`);
  },
};
