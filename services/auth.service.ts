import { apiClient, ApiResponse } from '@/lib/api-client';
import { User } from '@/types';

export interface SendOtpRequest {
  countryCode: string;
  phoneNumber: string;
}

export interface VerifyOtpRequest {
  countryCode: string;
  phoneNumber: string;
  code: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  isNewUser?: boolean;
}

export const authService = {
  async sendOtp(data: SendOtpRequest): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/otp', data);
    return response.data.data;
  },

  async verifyOtp(data: VerifyOtpRequest): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify', data);
    return response.data.data;
  },

  async logout(): Promise<{ message: string }> {
    const response = await apiClient.post<ApiResponse<{ message: string }>>('/auth/logout');
    return response.data.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/refresh', {
      refreshToken,
    });
    return response.data.data;
  },
};
