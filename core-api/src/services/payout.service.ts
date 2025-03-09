import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Payout } from "../entities/Payout";
import { Campaign } from "../entities/Campaign";
import { Country } from "../entities/Country";
import { IntegrationService } from "./integration.service";

export class PayoutService {
  private payoutRepository: Repository<Payout>;
  private campaignRepository: Repository<Campaign>;
  private countryRepository: Repository<Country>;
  private integrationService: IntegrationService;

  constructor() {
    this.payoutRepository = AppDataSource.getRepository(Payout);
    this.campaignRepository = AppDataSource.getRepository(Campaign);
    this.countryRepository = AppDataSource.getRepository(Country);
    this.integrationService = new IntegrationService();
  }

  async getPayoutsByCampaignId(campaignId: number): Promise<Payout[]> {
    return this.payoutRepository.find({
      where: { campaign: { id: campaignId } },
      relations: ["country"],
    });
  }

  async createPayout(
    campaignId: number,
    countryId: number,
    payoutData: Partial<Payout>
  ): Promise<Payout | null> {
    const campaign = await this.campaignRepository.findOneBy({ id: campaignId });
    const country = await this.countryRepository.findOneBy({ id: countryId });
    
    if (!campaign || !country) return null;
    
    // Check if payout already exists for this campaign and country
    const existingPayout = await this.payoutRepository.findOne({
      where: {
        campaign: { id: campaignId },
        country: { id: countryId },
      },
    });
    
    if (existingPayout) {
      return null; // Or update existing payout if that's the intended behavior
    }
    
    const payout = this.payoutRepository.create({
      ...payoutData,
      campaign,
      country,
    });
    
    await this.payoutRepository.save(payout);
    
    // Notify integration service if campaign is running
    if (campaign.isRunning) {
      this.integrationService.notifyPayoutCreated(payout);
    }
    
    return payout;
  }

  async updatePayout(
    id: number,
    payoutData: Partial<Payout>
  ): Promise<Payout | null> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ["campaign", "country"],
    });
    
    if (!payout) return null;
    
    Object.assign(payout, payoutData);
    await this.payoutRepository.save(payout);
    
    // Notify integration service if campaign is running
    if (payout.campaign.isRunning) {
      this.integrationService.notifyPayoutUpdated(payout);
    }
    
    return payout;
  }

  async deletePayout(id: number): Promise<boolean> {
    const payout = await this.payoutRepository.findOne({
      where: { id },
      relations: ["campaign"],
    });
    
    if (!payout) return false;
    
    const isRunning = payout.campaign.isRunning;
    
    await this.payoutRepository.remove(payout);
    
    // Notify integration service if campaign is running
    if (isRunning) {
      this.integrationService.notifyPayoutDeleted(payout);
    }
    
    return true;
  }
}