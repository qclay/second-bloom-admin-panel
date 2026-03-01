import { apiClient, ApiResponse } from '@/lib/api-client';

export interface PublicationPricing {
  id: string;
  pricePerPost: number;
  currency: string;
  isActive: boolean;
  description: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt: string;
}

export interface UpdatePublicationPriceDto {
  price: number;
  description?: string;
  updatedBy?: string;
}

export const publicationPricingService = {
  async getCurrent(): Promise<PublicationPricing> {
    const response = await apiClient.get<ApiResponse<PublicationPricing>>('/settings/publication-price');
    return response.data.data;
  },

  async getHistory(): Promise<PublicationPricing[]> {
    const response = await apiClient.get<ApiResponse<PublicationPricing[]>>('/settings/publication-price/history');
    const raw = response.data.data;
    return Array.isArray(raw) ? raw : [];
  },

  async updatePrice(data: UpdatePublicationPriceDto): Promise<PublicationPricing> {
    const response = await apiClient.post<ApiResponse<PublicationPricing>>('/settings/publication-price', data);
    return response.data.data;
  },

  async activate(id: string): Promise<PublicationPricing> {
    const response = await apiClient.patch<ApiResponse<PublicationPricing>>(
      `/settings/publication-price/${id}/activate`
    );
    return response.data.data;
  },
};
