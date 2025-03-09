import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Campaign } from "../entities/Campaign";
import { Payout } from "../entities/Payout";
import { IntegrationService } from "./integration.service";

export class CampaignService {
  private campaignRepository: Repository<Campaign>;
  private payoutRepository: Repository<Payout>;
  private integrationService: IntegrationService;

  constructor() {
    this.campaignRepository = AppDataSource.getRepository(Campaign);
    this.payoutRepository = AppDataSource.getRepository(Payout);
    this.integrationService = new IntegrationService();
  }

  async getAllCampaigns(search?: string, isRunning?: boolean): Promise<Campaign[]> {
    const queryBuilder = this.campaignRepository.createQueryBuilder("campaign")
      .leftJoinAndSelect("campaign.payouts", "payout")
      .leftJoinAndSelect("payout.country", "country");

    if (search) {
      queryBuilder.where(
        "campaign.title ILIKE :search OR campaign.landingPageUrl ILIKE :search",
        { search: `%${search}%` }
      );
    }

    if (isRunning !== undefined) {
      const condition = search ? "AND" : "WHERE";
      queryBuilder.andWhere(`campaign.isRunning = :isRunning`, { isRunning });
    }

    return queryBuilder.getMany();
  }

  async getCampaignById(id: number): Promise<Campaign | null> {
    return this.campaignRepository.findOne({
      where: { id },
      relations: ["payouts", "payouts.country"],
    });
  }

  async createCampaign(campaignData: Partial<Campaign>): Promise<Campaign> {
    const campaign = this.campaignRepository.create(campaignData);
    await this.campaignRepository.save(campaign);
    
    // Notify integration service (if campaign is running)
    if (campaign.isRunning) {
      this.integrationService.notifyCampaignCreated(campaign);
    }
    
    return campaign;
  }

  async updateCampaign(id: number, campaignData: Partial<Campaign>): Promise<Campaign | null> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) return null;

    const wasRunning = campaign.isRunning;
    
    // Update campaign fields
    Object.assign(campaign, campaignData);
    await this.campaignRepository.save(campaign);
    
    // Notify integration service if running state changed
    if (!wasRunning && campaign.isRunning) {
      this.integrationService.notifyCampaignStarted(campaign);
    } else if (wasRunning && !campaign.isRunning) {
      this.integrationService.notifyCampaignStopped(campaign);
    } else if (wasRunning && campaign.isRunning) {
      this.integrationService.notifyCampaignUpdated(campaign);
    }
    
    return campaign;
  }

  async toggleCampaignStatus(id: number): Promise<Campaign | null> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) return null;
    
    campaign.isRunning = !campaign.isRunning;
    await this.campaignRepository.save(campaign);
    
    // Notify integration service
    if (campaign.isRunning) {
      this.integrationService.notifyCampaignStarted(campaign);
    } else {
      this.integrationService.notifyCampaignStopped(campaign);
    }
    
    return campaign;
  }

  async deleteCampaign(id: number): Promise<boolean> {
    const campaign = await this.getCampaignById(id);
    if (!campaign) return false;
    
    await this.campaignRepository.remove(campaign);
    
    // Notify integration service
    if (campaign.isRunning) {
      this.integrationService.notifyCampaignDeleted(campaign);
    }
    
    return true;
  }
}