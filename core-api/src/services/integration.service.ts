import { Campaign } from "../entities/Campaign";
import { Payout } from "../entities/Payout";
import axios from "axios";

export class IntegrationService {
  private integrationApiUrl: string;

  constructor() {
    this.integrationApiUrl = process.env.INTEGRATION_API_URL || "http://integration-api:4000";
  }

  async notifyCampaignCreated(campaign: Campaign): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/campaign`, {
        action: "create",
        campaign,
      });
    } catch (error) {
      console.error("Failed to notify integration API about campaign creation:", error);
    }
  }

  async notifyCampaignUpdated(campaign: Campaign): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/campaign`, {
        action: "update",
        campaign,
      });
    } catch (error) {
      console.error("Failed to notify integration API about campaign update:", error);
    }
  }

  async notifyCampaignStarted(campaign: Campaign): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/campaign`, {
        action: "start",
        campaign,
      });
    } catch (error) {
      console.error("Failed to notify integration API about campaign start:", error);
    }
  }

  async notifyCampaignStopped(campaign: Campaign): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/campaign`, {
        action: "stop",
        campaign,
      });
    } catch (error) {
      console.error("Failed to notify integration API about campaign stop:", error);
    }
  }

  async notifyCampaignDeleted(campaign: Campaign): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/campaign`, {
        action: "delete",
        campaign,
      });
    } catch (error) {
      console.error("Failed to notify integration API about campaign deletion:", error);
    }
  }

  async notifyPayoutCreated(payout: Payout): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/payout`, {
        action: "create",
        payout,
      });
    } catch (error) {
      console.error("Failed to notify integration API about payout creation:", error);
    }
  }

  async notifyPayoutUpdated(payout: Payout): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/payout`, {
        action: "update",
        payout,
      });
    } catch (error) {
      console.error("Failed to notify integration API about payout update:", error);
    }
  }

  async notifyPayoutDeleted(payout: Payout): Promise<void> {
    try {
      await axios.post(`${this.integrationApiUrl}/sync/payout`, {
        action: "delete",
        payout,
      });
    } catch (error) {
      console.error("Failed to notify integration API about payout deletion:", error);
    }
  }
}