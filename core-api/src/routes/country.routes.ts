import { Router } from "express";
import { CountryController } from "../controllers/country.controller";
import { validateId } from "../middleware/validation.middleware";

const router = Router();
const countryController = new CountryController();

router.get("/", countryController.getAllCountries.bind(countryController));
router.get("/:id", validateId(), countryController.getCountryById.bind(countryController));

export default router;