import { api } from '../lib/api';

export interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  is_active: boolean;
  created_at?: string;
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
}

export interface CreateApiKeyPayload {
  name: string;
  scopes?: string[];
  expires_at?: string | null;
}

export interface ApiKeyUsageSummary {
  total_requests: number;
  error_rate: number;
  daily: { date: string; count: number }[];
  top_endpoints: { endpoint: string; count: number }[];
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const apiKeyService = {
  async list(): Promise<ApiKeyRecord[]> {
    const response = await api.get<ApiResponse<ApiKeyRecord[]>>('/v1/api-keys');
    return response.data.data || [];
  },

  async create(payload: CreateApiKeyPayload): Promise<ApiKeyRecord & { api_key: string }> {
    const response = await api.post<ApiResponse<ApiKeyRecord & { api_key: string }>>(
      '/v1/api-keys',
      payload
    );
    return response.data.data;
  },

  async revoke(apiKeyId: string): Promise<void> {
    await api.delete(`/v1/api-keys/${apiKeyId}`);
  },

  async getUsage(days = 7): Promise<ApiKeyUsageSummary> {
    const response = await api.get<ApiResponse<ApiKeyUsageSummary>>('/v1/api-keys/usage', {
      params: { days },
    });
    return response.data.data;
  },

  async exportUsage(days = 7): Promise<Blob> {
    const response = await api.get('/v1/api-keys/usage/export', {
      params: { days },
      responseType: 'blob',
    });
    return response.data;
  },
};
