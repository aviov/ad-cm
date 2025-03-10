export interface Campaign {
  id: number;
  title: string;
  landingPageUrl: string;
  isRunning: boolean;
  payouts: Payout[];
  createdAt: string;
  updatedAt: string;
}

export interface Country {
  id: number;
  code: string;
  name: string;
}

export interface Payout {
  id: number;
  amount: number;
  budget: number | null;
  autoStop: boolean;
  budgetAlert: boolean;
  budgetAlertEmail: string | null;
  countryId: number;
  country?: Country;
  campaignId?: number;
}

export interface CampaignFormData {
  title: string;
  landingPageUrl: string;
  isRunning?: boolean;
  payouts: PayoutFormData[];
}

export interface PayoutFormData {
  id?: number;
  countryId: number;
  amount: number;
  budget?: number | null;
  autoStop?: boolean;
  budgetAlert?: boolean;
  budgetAlertEmail?: string | null;
}

// Adding these new types for the API requests
export interface CreateCampaignInput extends CampaignFormData {
  // Extending CampaignFormData for create operations
}

export interface UpdateCampaignInput {
  title?: string;
  landingPageUrl?: string;
  isRunning?: boolean;
  payouts?: PayoutFormData[];
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}