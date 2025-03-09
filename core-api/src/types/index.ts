// Common interfaces for request/response payloads
export interface PaginationParams {
    page?: number;
    limit?: number;
  }
  
  export interface SearchParams {
    search?: string;
    isRunning?: boolean;
  }
  
  // Campaign related types
  export interface CampaignCreateDTO {
    title: string;
    landingPageUrl: string;
    isRunning?: boolean;
    payouts?: PayoutCreateDTO[];
  }
  
  export interface CampaignUpdateDTO {
    title?: string;
    landingPageUrl?: string;
    isRunning?: boolean;
  }
  
  // Payout related types
  export interface PayoutCreateDTO {
    countryId: number;
    amount: number;
    budget?: number;
    autoStop?: boolean;
    budgetAlert?: boolean;
    budgetAlertEmail?: string;
  }
  
  export interface PayoutUpdateDTO {
    amount?: number;
    budget?: number;
    autoStop?: boolean;
    budgetAlert?: boolean;
    budgetAlertEmail?: string;
  }
  
  // For integration service
  export interface IntegrationPayload {
    action: 'create' | 'update' | 'delete' | 'start' | 'stop';
    data: any;
  }
  
  // Error response type
  export interface ErrorResponse {
    message: string;
    errors?: Array<{
      field: string;
      message: string;
    }>;
  }
  
  // Campaign statistics
  export interface CampaignStatistics {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    totalSpent: number;
    campaignsByCountry: {
      countryCode: string;
      countryName: string;
      count: number;
    }[];
  }
  
  // Budget metrics for dashboard
  export interface BudgetMetrics {
    campaignId: number;
    campaignTitle: string;
    totalBudget: number;
    budgetByCountry: {
      countryCode: string;
      countryName: string;
      budget: number;
      payout: number;
    }[];
  }