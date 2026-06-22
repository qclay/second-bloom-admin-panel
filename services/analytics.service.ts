import { apiClient, ApiResponse } from '@/lib/api-client';

export interface PeriodStats {
  date: string;
  label: string;
  usersOnline: number;
  bouquetsAdded: number;
  bidsCount: number;
}

export interface WeekPeriodStats {
  dateFrom: string;
  dateTo: string;
  label: string;
  usersOnline: number;
  bouquetsAdded: number;
  bidsCount: number;
}

export interface TotalsStats {
  totalUsers: number;
  totalBouquets: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCategories: number;
}

export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

export interface OrderStatusDistribution {
  status: string;
  count: number;
}

export interface CustomPeriodStats {
  dateFrom: string;
  dateTo: string;
  label: string;
  bouquetsAdded: number;
  bidsCount: number;
}

export interface AnalyticsDashboard {
  today: PeriodStats;
  week: WeekPeriodStats;
  totals: TotalsStats;
  customPeriod?: CustomPeriodStats;
  monthlyRevenue: MonthlyRevenue[];
  orderStatusDistribution: OrderStatusDistribution[];
}

export interface ActiveUsersStats {
  activeUsers: number;
}

export interface AnalyticsQuery {
  dateFrom?: string;
  dateTo?: string;
}

export const analyticsService = {
  async getDashboard(params?: AnalyticsQuery): Promise<AnalyticsDashboard> {
    const response = await apiClient.get<ApiResponse<AnalyticsDashboard>>('/analytics/dashboard', {
      params: params?.dateFrom && params?.dateTo ? { dateFrom: params.dateFrom, dateTo: params.dateTo } : undefined,
    });
    return response.data.data;
  },

  async getActiveUsers(): Promise<ActiveUsersStats> {
    const response = await apiClient.get<ApiResponse<ActiveUsersStats>>('/analytics/active-users');
    return response.data.data;
  },
};
