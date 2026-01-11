import { apiClient, ApiResponse } from '@/lib/api-client';
import { FileResponse, PaginatedResponse } from '@/types';

export interface FileQuery {
  page?: number;
  limit?: number;
  fileType?: string;
  isPublic?: boolean;
}

export const fileService = {
  async upload(file: File): Promise<FileResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<FileResponse>>('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async getAll(query?: FileQuery): Promise<PaginatedResponse<FileResponse>> {
    const response = await apiClient.get<ApiResponse<FileResponse[]>>('/files', {
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

  async getById(id: string): Promise<FileResponse> {
    const response = await apiClient.get<ApiResponse<FileResponse>>(`/files/${id}`);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },
};
