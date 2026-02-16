import { apiClient, ApiResponse } from '@/lib/api-client';

export interface ReviewUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phoneNumber: string;
  avatarId?: string | null;
}

export interface ReviewProduct {
  id: string;
  title: string;
  slug: string;
}

export interface Review {
  id: string;
  reviewerId: string;
  revieweeId: string;
  productId: string | null;
  orderId: string | null;
  parentId: string | null;
  rating: number;
  comment: string | null;
  isVerified: boolean;
  isReported: boolean;
  reportReason: string | null;
  reportedAt: string | null;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
  reviewer?: ReviewUser;
  reviewee?: ReviewUser;
  product?: ReviewProduct | null;
  replies?: Review[];
  parent?: { id: string; rating: number; comment: string | null } | null;
}

export interface ReviewQuery {
  page?: number;
  limit?: number;
  reviewerId?: string;
  revieweeId?: string;
  productId?: string;
  minRating?: number;
  maxRating?: number;
  isReported?: boolean;
  sortBy?: 'createdAt' | 'rating';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedReviews {
  data: Review[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateReviewDto {
  rating?: number;
  comment?: string;
  isReported?: boolean;
  reportReason?: string;
}

export const reviewService = {
  async getAll(query?: ReviewQuery): Promise<PaginatedReviews> {
    const response = await apiClient.get<ApiResponse<{ data: Review[]; meta: { total: number; page: number; limit: number; totalPages: number } }>>(
      '/reviews',
      { params: query ?? { limit: 20 } }
    );
    const body = response.data.data as { data?: Review[]; meta?: PaginatedReviews['meta'] } | Review[];
    const list = Array.isArray(body) ? body : body?.data ?? [];
    const meta = Array.isArray(body) ? undefined : body?.meta;
    return {
      data: list,
      meta: {
        total: meta?.total ?? 0,
        page: meta?.page ?? 1,
        limit: meta?.limit ?? 20,
        totalPages: meta?.totalPages ?? 0,
      },
    };
  },

  async getById(id: string): Promise<Review> {
    const response = await apiClient.get<ApiResponse<Review>>(`/reviews/${id}`);
    return response.data.data;
  },

  async update(id: string, data: UpdateReviewDto): Promise<Review> {
    const response = await apiClient.patch<ApiResponse<Review>>(`/reviews/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reviews/${id}`);
  },
};
