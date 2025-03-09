import { AppDataSource } from "../data-source";
import { seedCountries } from "./countries.seed";

const runSeeds = async () => {
  try {
    // Initialize the database connection
    await AppDataSource.initialize();
    console.log("Database connection initialized");
    
    // Run seeds
    await seedCountries();
    
    console.log("All seeds completed successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running seeds:", error);
    process.exit(1);
  }
};

runSeeds();