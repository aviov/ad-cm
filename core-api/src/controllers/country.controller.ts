import { Request, Response } from "express";
import { CountryService } from "../services/country.service";

export class CountryController {
  private countryService: CountryService;

  constructor() {
    this.countryService = new CountryService();
  }

  async getAllCountries(req: Request, res: Response): Promise<void> {
    try {
      const countries = await this.countryService.getAllCountries();
      res.json(countries);
    } catch (error) {
      console.error("Error getting all countries:", error);
      res.status(500).json({ message: "Failed to retrieve countries" });
    }
  }

  async getCountryById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      const country = await this.countryService.getCountryById(id);
      
      if (!country) {
        res.status(404).json({ message: "Country not found" });
        return;
      }
      
      res.json(country);
    } catch (error) {
      console.error("Error getting country by ID:", error);
      res.status(500).json({ message: "Failed to retrieve country" });
    }
  }
}