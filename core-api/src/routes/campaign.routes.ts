import { Router } from "express";
import { CampaignController } from "../controllers/campaign.controller";
import { body } from "express-validator";
import { validate, validateId } from "../middleware/validation.middleware";

const router = Router();
const campaignController = new CampaignController();

// Validation middleware
const validateCampaign = [
  body("title").notEmpty().withMessage("Title is required"),
  body("landingPageUrl").notEmpty().isURL().withMessage("Valid landing page URL is required"),
  body("payouts").isArray().optional(),
  body("payouts.*.countryId").isInt().withMessage("Country ID must be an integer"),
  body("payouts.*.amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("payouts.*.budget").isFloat({ min: 0 }).optional().withMessage("Budget must be a positive number"),
];

// Routes
router.get("/", campaignController.getAllCampaigns);
router.get("/:id", validateId(), campaignController.getCampaignById);
router.post("/", validate(validateCampaign), campaignController.createCampaign);
router.put("/:id", validateId(), validate(validateCampaign), campaignController.updateCampaign);
router.patch("/:id/toggle", validateId(), campaignController.toggleCampaignStatus);
router.delete("/:id", validateId(), campaignController.deleteCampaign);

export default router;