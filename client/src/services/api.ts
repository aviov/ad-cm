import axios, { AxiosError, AxiosResponse } from 'axios';
import { Campaign, CampaignFormData, Payout, PayoutFormData, ApiError } from '../types';

// Create axios instance with base URL
const api = axios.create({
  // Configure baseURL based on environment:
  // 1. In development (localhost), use the configured API URL from .env
  // 2. In production (CloudFront), use relative paths to let CloudFront handle routing
  baseURL: window.location.hostname === 'localhost' 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:3000') 
    : '',
  headers: {
    'Content-Type': 'application/json',
  },
  // Add withCredentials to properly handle CORS with credentials
  withCredentials: true,
});

// Add request interceptor for debugging
api.interceptors.request.use(config => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
  return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  error => {
    console.error('API Error:', error.response?.status, error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Log what API endpoint we're using
console.log(`API endpoint: ${api.defaults.baseURL || window.location.origin}`);

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
    return api.get('/api/campaigns').then(handleResponse).catch(handleError);
  },
  
  // Get single campaign by ID
  getById: async (id: number): Promise<Campaign> => {
    return api.get(`/api/campaigns/${id}`).then(handleResponse).catch(handleError);
  },
  
  // Create new campaign
  create: async (data: CampaignFormData): Promise<Campaign> => {
    return api.post('/api/campaigns', data).then(handleResponse).catch(handleError);
  },
  
  // Update existing campaign
  update: async (id: number, data: CampaignFormData): Promise<Campaign> => {
    return api.put(`/api/campaigns/${id}`, data).then(handleResponse).catch(handleError);
  },
  
  // Toggle campaign status
  toggleStatus: async (id: number): Promise<Campaign> => {
    return api.patch(`/api/campaigns/${id}/toggle`).then(handleResponse).catch(handleError);
  },
  
  // Delete campaign
  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/campaigns/${id}`).then(() => undefined).catch(handleError);
  },
};

// Payout endpoints
export const payoutApi = {
  // Get payouts by campaign ID
  getByCampaignId: async (campaignId: number): Promise<Payout[]> => {
    return api.get(`/api/payouts/campaign/${campaignId}`).then(handleResponse).catch(handleError);
  },
  
  // Create new payout
  create: async (campaignId: number, data: PayoutFormData): Promise<Payout> => {
    return api.post(`/api/payouts/campaign/${campaignId}`, data).then(handleResponse).catch(handleError);
  },
  
  // Update existing payout
  update: async (id: number, data: PayoutFormData): Promise<Payout> => {
    return api.put(`/api/payouts/${id}`, data).then(handleResponse).catch(handleError);
  },
  
  // Delete payout
  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/payouts/${id}`).then(() => undefined).catch(handleError);
  },
};

// Country endpoints
export const countryApi = {
  getAll: async () => {
    return api.get('/api/countries').then(handleResponse).catch(handleError);
  },
};

export default api;