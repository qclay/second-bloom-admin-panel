import { apiClient, ApiResponse } from '@/lib/api-client';
import { Product, PaginatedResponse } from '@/types';

export interface CreateProductDto {
  title: string;
  description?: string;
  price: number;
  currency?: string;
  categoryId: string;
  tags?: string[];
  type?: string;
  condition?: string;
  quantity?: number;
  status?: string;
  isFeatured?: boolean;
  region?: string;
  city?: string;
  district?: string;
  imageIds?: string[];
}

export interface UpdateProductDto extends Partial<CreateProductDto> {}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: string;
  isFeatured?: boolean;
}

export const productService = {
  async getAll(query?: ProductQuery): Promise<PaginatedResponse<Product>> {
    const response = await apiClient.get<ApiResponse<Product[]>>('/products', {
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

  async getById(id: string): Promise<Product> {
    const response = await apiClient.get<ApiResponse<Product>>(`/products/${id}`);
    return response.data.data;
  },

  async create(data: CreateProductDto): Promise<Product> {
    const response = await apiClient.post<ApiResponse<Product>>('/products', data);
    return response.data.data;
  },

  async update(id: string, data: UpdateProductDto): Promise<Product> {
    const response = await apiClient.patch<ApiResponse<Product>>(`/products/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
