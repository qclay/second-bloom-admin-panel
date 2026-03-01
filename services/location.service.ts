import { apiClient, ApiResponse } from '@/lib/api-client';

function toStringName(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    const o = value as Record<string, unknown>;
    const s = o.en ?? o.uz ?? o.ru;
    return typeof s === 'string' ? s : '';
  }
  return String(value);
}

export interface Country {
  id: string;
  name: string;
  code?: string | null;
}

export interface Region {
  id: string;
  name: string;
  countryId: string;
}

export interface City {
  id: string;
  name: string;
  regionId: string;
}

export interface District {
  id: string;
  name: string;
  cityId: string;
}

export const locationService = {
  async getCountries(): Promise<Country[]> {
    const response = await apiClient.get<ApiResponse<Country[]>>('/locations/countries');
    const raw = response.data.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((c) => ({ ...c, name: toStringName((c as { name?: unknown }).name) }));
  },

  async getRegions(countryId?: string): Promise<Region[]> {
    const response = await apiClient.get<ApiResponse<Region[]>>('/locations/regions', {
      params: countryId ? { countryId } : undefined,
    });
    const raw = response.data.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((r) => ({ ...r, name: toStringName((r as { name?: unknown }).name) }));
  },

  async getCities(regionId?: string): Promise<City[]> {
    const response = await apiClient.get<ApiResponse<City[]>>('/locations/cities', {
      params: regionId ? { regionId } : undefined,
    });
    const raw = response.data.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((c) => ({ ...c, name: toStringName((c as { name?: unknown }).name) }));
  },

  async getDistricts(cityId?: string): Promise<District[]> {
    const response = await apiClient.get<ApiResponse<District[]>>('/locations/districts', {
      params: cityId ? { cityId } : undefined,
    });
    const raw = response.data.data;
    const list = Array.isArray(raw) ? raw : [];
    return list.map((d) => ({ ...d, name: toStringName((d as { name?: unknown }).name) }));
  },
};
