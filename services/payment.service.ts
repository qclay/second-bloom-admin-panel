import { apiClient, ApiResponse } from '@/lib/api-client';
import { PaginatedResponse, Payment, PaymentAnalytics, PaymentSource, AdminPaymentStatus, PaymentType } from '@/types';

export interface PaymentQuery {
  page?: number;
  limit?: number;
  source?: PaymentSource;
  status?: AdminPaymentStatus;
  paymentType?: PaymentType;
}

export const paymentService = {
  async getAll(query?: PaymentQuery): Promise<PaginatedResponse<Payment>> {
    const response = await apiClient.get<ApiResponse<Payment[]>>('/payments/admin/all', {
      params: query,
    });

    const raw = response.data.meta as Record<string, unknown> | undefined;
    const pagination = (raw?.pagination as Record<string, unknown> | undefined) ?? raw;
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

  async getAnalytics(query?: { period?: '7d' | '30d' | '90d' | 'all'; source?: PaymentSource }): Promise<PaymentAnalytics> {
    const response = await apiClient.get<ApiResponse<PaymentAnalytics>>('/payments/admin/analytics', {
      params: query,
    });
    return response.data.data;
  },
};
