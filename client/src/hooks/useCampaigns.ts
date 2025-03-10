import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Campaign, CreateCampaignInput, UpdateCampaignInput, CampaignFormData } from '../types';
import { campaignApi } from '../services/api';

interface UseCampaignsOptions {
  initialFilters?: {
    search?: string;
    isRunning?: boolean;
    page?: number;
    limit?: number;
  };
}

interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
}

interface UseCampaignsReturn {
  campaigns: Campaign[];
  totalCampaigns: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  filters: {
    search: string;
    isRunning: boolean | null;
    page: number;
    limit: number;
  };
  setFilters: (filters: Partial<{
    search: string;
    isRunning: boolean | null;
    page: number;
    limit: number;
  }>) => void;
  createCampaign: (data: CreateCampaignInput) => Promise<Campaign>;
  updateCampaign: (id: number, data: UpdateCampaignInput) => Promise<Campaign>;
  deleteCampaign: (id: number) => Promise<void>;
  startCampaign: (id: number) => Promise<Campaign>;
  stopCampaign: (id: number) => Promise<Campaign>;
}

// Mock function to get campaigns with filters since our API doesn't support it directly
const getCampaignsWithFilters = async (filters: UseCampaignsReturn['filters']): Promise<CampaignsResponse> => {
  const campaigns = await campaignApi.getAll();
  
  // Apply filters
  let filteredCampaigns = [...campaigns];
  
  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredCampaigns = filteredCampaigns.filter(campaign => 
      campaign.title.toLowerCase().includes(searchLower) || 
      campaign.landingPageUrl.toLowerCase().includes(searchLower)
    );
  }
  
  // Apply isRunning filter
  if (filters.isRunning !== null) {
    filteredCampaigns = filteredCampaigns.filter(campaign => 
      campaign.isRunning === filters.isRunning
    );
  }
  
  // Calculate total for pagination
  const total = filteredCampaigns.length;
  
  // Apply pagination
  const start = (filters.page - 1) * filters.limit;
  const end = start + filters.limit;
  filteredCampaigns = filteredCampaigns.slice(start, end);
  
  return {
    campaigns: filteredCampaigns,
    total
  };
};

export const useCampaigns = (options?: UseCampaignsOptions): UseCampaignsReturn => {
  const queryClient = useQueryClient();
  
  // Define the filter type explicitly
  type FiltersType = {
    search: string;
    isRunning: boolean | null;
    page: number;
    limit: number;
  };
  
  const [filters, setFiltersState] = useState<FiltersType>({
    search: options?.initialFilters?.search || '',
    isRunning: options?.initialFilters?.isRunning || null,
    page: options?.initialFilters?.page || 1,
    limit: options?.initialFilters?.limit || 10,
  });

  const setFilters = useCallback((newFilters: Partial<FiltersType>) => {
    setFiltersState(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when search or filter changes
      page: newFilters.search !== undefined || newFilters.isRunning !== undefined ? 1 : newFilters.page || prev.page,
    }));
  }, []);

  // Query for fetching campaigns
  const { data, isLoading, isError, error } = useQuery(
    ['campaigns', filters],
    () => getCampaignsWithFilters(filters),
    {
      keepPreviousData: true,
    }
  );

  // Mutations for campaign operations
  const createMutation = useMutation(
    (campaignData: CampaignFormData) => campaignApi.create(campaignData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campaigns');
      },
    }
  );

  const updateMutation = useMutation(
    ({ id, data }: { id: number; data: CampaignFormData }) => campaignApi.update(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campaigns');
      },
    }
  );

  const deleteMutation = useMutation(
    (id: number) => campaignApi.delete(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('campaigns');
      },
    }
  );

  const toggleStatusMutation = useMutation(
    (id: number) => campaignApi.toggleStatus(id),
    {
      onSuccess: (updatedCampaign) => {
        queryClient.invalidateQueries('campaigns');
        
        // Optimistically update the cache
        queryClient.setQueryData(['campaign', updatedCampaign.id], updatedCampaign);
      },
    }
  );

  // Handler functions
  const createCampaign = async (campaignData: CreateCampaignInput): Promise<Campaign> => {
    return createMutation.mutateAsync(campaignData as CampaignFormData);
  };

  const updateCampaign = async (id: number, campaignData: UpdateCampaignInput): Promise<Campaign> => {
    return updateMutation.mutateAsync({ id, data: campaignData as CampaignFormData });
  };

  const deleteCampaign = async (id: number): Promise<void> => {
    return deleteMutation.mutateAsync(id);
  };

  const startCampaign = async (id: number): Promise<Campaign> => {
    // First check if the campaign is already running
    const campaign = await campaignApi.getById(id);
    if (campaign.isRunning) return campaign;
    
    // If not running, toggle its status
    return toggleStatusMutation.mutateAsync(id);
  };

  const stopCampaign = async (id: number): Promise<Campaign> => {
    // First check if the campaign is already stopped
    const campaign = await campaignApi.getById(id);
    if (!campaign.isRunning) return campaign;
    
    // If running, toggle its status
    return toggleStatusMutation.mutateAsync(id);
  };

  return {
    campaigns: data?.campaigns || [],
    totalCampaigns: data?.total || 0,
    isLoading,
    isError,
    error,
    filters,
    setFilters,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign,
    stopCampaign,
  };
};

export default useCampaigns;
