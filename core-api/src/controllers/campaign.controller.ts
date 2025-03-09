import { Request, Response } from "express";
import { CampaignService } from "../services/campaign.service";
import { validationResult } from "express-validator";

export class CampaignController {
  private campaignService: CampaignService;

  constructor() {
    this.campaignService = new CampaignService();
  }

  getAllCampaigns = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search, isRunning } = req.query;
      const campaigns = await this.campaignService.getAllCampaigns(
        search as string,
        isRunning === "true" ? true : isRunning === "false" ? false : undefined
      );
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      res.status(500).json({ message: "Failed to fetch campaigns" });
    }
  };

  getCampaignById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await this.campaignService.getCampaignById(id);
      
      if (!campaign) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      res.status(500).json({ message: "Failed to fetch campaign" });
    }
  };

  createCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const campaign = await this.campaignService.createCampaign(req.body);
      res.status(201).json(campaign);
    } catch (error) {
      console.error("Error creating campaign:", error);
      res.status(500).json({ message: "Failed to create campaign" });
    }
  };

  updateCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const id = parseInt(req.params.id);
      const campaign = await this.campaignService.updateCampaign(id, req.body);
      
      if (!campaign) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error updating campaign:", error);
      res.status(500).json({ message: "Failed to update campaign" });
    }
  };

  toggleCampaignStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const campaign = await this.campaignService.toggleCampaignStatus(id);
      
      if (!campaign) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      
      res.json(campaign);
    } catch (error) {
      console.error("Error toggling campaign status:", error);
      res.status(500).json({ message: "Failed to toggle campaign status" });
    }
  };

  deleteCampaign = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const success = await this.campaignService.deleteCampaign(id);
      
      if (!success) {
        res.status(404).json({ message: "Campaign not found" });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting campaign:", error);
      res.status(500).json({ message: "Failed to delete campaign" });
    }
  };
}