import { Router } from "express";
import { PayoutController } from "../controllers/payout.controller";
import { body } from "express-validator";
import { validate, validateId } from "../middleware/validation.middleware";

const router = Router();
const payoutController = new PayoutController();

// Validation middleware
const validatePayout = [
  body("countryId").isInt().withMessage("Country ID must be an integer"),
  body("amount").isFloat({ min: 0 }).withMessage("Amount must be a positive number"),
  body("budget").isFloat({ min: 0 }).optional().withMessage("Budget must be a positive number"),
  body("autoStop").isBoolean().optional(),
  body("budgetAlert").isBoolean().optional(),
  body("budgetAlertEmail").isEmail().optional().withMessage("Invalid email address"),
];

// Routes
router.get("/campaign/:campaignId", validateId('campaignId'), payoutController.getPayoutsByCampaignId);
router.post("/campaign/:campaignId", validateId('campaignId'), validate(validatePayout), payoutController.createPayout);
router.put("/:id", validateId(), validate(validatePayout), payoutController.updatePayout);
router.delete("/:id", validateId(), payoutController.deletePayout);

export default router;