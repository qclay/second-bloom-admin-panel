import { apiClient, ApiResponse } from '@/lib/api-client';

export interface CreateAuctionDto {
  productId: string;
  startPrice: number;
  bidIncrement?: number;
  minBidAmount?: number;
  endTime?: string;
  durationHours?: number;
  autoExtend?: boolean;
  extendMinutes?: number;
}

export const auctionService = {
  async create(data: CreateAuctionDto): Promise<{ id: string }> {
    const response = await apiClient.post<ApiResponse<{ id: string }>>('/auctions', data);
    return response.data.data;
  },
};
