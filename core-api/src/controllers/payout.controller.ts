import { Request, Response } from "express";
import { PayoutService } from "../services/payout.service";
import { validationResult } from "express-validator";

export class PayoutController {
  private payoutService: PayoutService;

  constructor() {
    this.payoutService = new PayoutService();
  }

  getPayoutsByCampaignId = async (req: Request, res: Response): Promise<void> => {
    try {
      const campaignId = parseInt(req.params.campaignId);
      const payouts = await this.payoutService.getPayoutsByCampaignId(campaignId);
      
      res.json(payouts);
    } catch (error) {
      console.error("Error fetching payouts:", error);
      res.status(500).json({ message: "Failed to fetch payouts" });
    }
  };

  createPayout = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const campaignId = parseInt(req.params.campaignId);
      const { countryId, ...payoutData } = req.body;
      
      const payout = await this.payoutService.createPayout(
        campaignId,
        countryId,
        payoutData
      );
      
      if (!payout) {
        res.status(404).json({ 
          message: "Campaign or country not found, or payout already exists for this country" 
        });
        return;
      }
      
      res.status(201).json(payout);
    } catch (error) {
      console.error("Error creating payout:", error);
      res.status(500).json({ message: "Failed to create payout" });
    }
  };

  updatePayout = async (req: Request, res: Response): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }
      
      const id = parseInt(req.params.id);
      const payout = await this.payoutService.updatePayout(id, req.body);
      
      if (!payout) {
        res.status(404).json({ message: "Payout not found" });
        return;
      }
      
      res.json(payout);
    } catch (error) {
      console.error("Error updating payout:", error);
      res.status(500).json({ message: "Failed to update payout" });
    }
  };

  deletePayout = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(req.params.id);
      const success = await this.payoutService.deletePayout(id);
      
      if (!success) {
        res.status(404).json({ message: "Payout not found" });
        return;
      }
      
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting payout:", error);
      res.status(500).json({ message: "Failed to delete payout" });
    }
  };
}