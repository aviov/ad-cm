import axios, { AxiosError, AxiosResponse } from 'axios';
import { Campaign, CampaignFormData, Payout, PayoutFormData, ApiError } from '../types';

// Create axios instance with base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// API response handlers
const handleResponse = <T>(response: AxiosResponse<T>): T => response.data;

const handleError = (error: AxiosError<ApiError>): Promise<never> => {
  const message = error.response?.data?.message || error.message;
  return Promise.reject(message);
};

// Campaign endpoints
export const campaignApi = {
  // Get all campaigns
  getAll: async (): Promise<Campaign[]> => {
    return api.get('/campaigns').then(handleResponse).catch(handleError);
  },
  
  // Get single campaign by ID
  getById: async (id: number): Promise<Campaign> => {
    return api.get(`/campaigns/${id}`).then(handleResponse).catch(handleError);
  },
  
  // Create new campaign
  create: async (data: CampaignFormData): Promise<Campaign> => {
    return api.post('/campaigns', data).then(handleResponse).catch(handleError);
  },
  
  // Update existing campaign
  update: async (id: number, data: CampaignFormData): Promise<Campaign> => {
    return api.put(`/campaigns/${id}`, data).then(handleResponse).catch(handleError);
  },
  
  // Toggle campaign status
  toggleStatus: async (id: number): Promise<Campaign> => {
    return api.patch(`/campaigns/${id}/toggle`).then(handleResponse).catch(handleError);
  },
  
  // Delete campaign
  delete: async (id: number): Promise<void> => {
    return api.delete(`/campaigns/${id}`).then(() => undefined).catch(handleError);
  },
};

// Payout endpoints
export const payoutApi = {
  // Get payouts by campaign ID
  getByCampaignId: async (campaignId: number): Promise<Payout[]> => {
    return api.get(`/payouts/campaign/${campaignId}`).then(handleResponse).catch(handleError);
  },
  
  // Create new payout
  create: async (campaignId: number, data: PayoutFormData): Promise<Payout> => {
    return api.post(`/payouts/campaign/${campaignId}`, data).then(handleResponse).catch(handleError);
  },
  
  // Update existing payout
  update: async (id: number, data: PayoutFormData): Promise<Payout> => {
    return api.put(`/payouts/${id}`, data).then(handleResponse).catch(handleError);
  },
  
  // Delete payout
  delete: async (id: number): Promise<void> => {
    return api.delete(`/payouts/${id}`).then(() => undefined).catch(handleError);
  },
};

// Country endpoints (assuming these exist or will be created)
export const countryApi = {
  getAll: async () => {
    return api.get('/countries').then(handleResponse).catch(handleError);
  },
};

export default api;