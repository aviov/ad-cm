import { Repository } from "typeorm";
import { AppDataSource } from "../database/data-source";
import { Country } from "../entities/Country";

export class CountryService {
  private countryRepository: Repository<Country>;

  constructor() {
    this.countryRepository = AppDataSource.getRepository(Country);
  }

  async getAllCountries(): Promise<Country[]> {
    return this.countryRepository.find({
      order: {
        name: "ASC"
      }
    });
  }

  async getCountryById(id: number): Promise<Country | null> {
    return this.countryRepository.findOneBy({ id });
  }

  async getCountryByCode(code: string): Promise<Country | null> {
    return this.countryRepository.findOneBy({ code });
  }

  async createCountry(countryData: Partial<Country>): Promise<Country> {
    const country = this.countryRepository.create(countryData);
    await this.countryRepository.save(country);
    return country;
  }

  async updateCountry(id: number, countryData: Partial<Country>): Promise<Country | null> {
    const country = await this.getCountryById(id);
    if (!country) return null;
    
    Object.assign(country, countryData);
    await this.countryRepository.save(country);
    
    return country;
  }

  async deleteCountry(id: number): Promise<boolean> {
    const country = await this.getCountryById(id);
    if (!country) return false;
    
    await this.countryRepository.remove(country);
    return true;
  }

  async seedCountries(countries: Array<{ code: string; name: string }>): Promise<void> {
    // Check if countries already exist
    const count = await this.countryRepository.count();
    if (count > 0) {
      console.log('Countries already seeded, skipping...');
      return;
    }

    const countryEntities = countries.map(country => this.countryRepository.create(country));
    await this.countryRepository.save(countryEntities);
    console.log(`Seeded ${countryEntities.length} countries`);
  }
}