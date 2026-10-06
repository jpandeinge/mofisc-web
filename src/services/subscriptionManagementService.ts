import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:8000/api'}/v1`;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Auth interceptor
api.interceptors.request.use(async (config) => {
  const session = await supabase.auth.getSession();
  if (session?.data?.session) {
    config.headers['Authorization'] = `Bearer ${session.data.session.access_token}`;
  }
  return config;
});

export const SubscriptionManagementService = {
  async pauseSubscription(subscriptionId: string, resumeDate?: string) {
    const response = await api.patch(`/subscriptions/${subscriptionId}/pause`, {
      resume_date: resumeDate
    });
    return response.data;
  },

  async resumeSubscription(subscriptionId: string) {
    const response = await api.patch(`/subscriptions/${subscriptionId}/resume`);
    return response.data;
  },

  async deleteSubscription(subscriptionId: string) {
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  },

  async renameSubscription(subscriptionId: string, customName: string) {
    const response = await api.patch(`/subscriptions/${subscriptionId}/rename`, {
      custom_name: customName
    });
    return response.data;
  }
};
