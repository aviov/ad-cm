import "reflect-metadata";
import { DataSource } from "typeorm";
import { Campaign } from "../entities/Campaign";
import { Country } from "../entities/Country";
import { Payout } from "../entities/Payout";
import dotenv from "dotenv";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "campaignmanager",
  synchronize: process.env.NODE_ENV === "development",
  logging: process.env.NODE_ENV === "development",
  entities: [Campaign, Country, Payout],
  migrations: ["src/database/migrations/**/*.ts"],
  subscribers: [],
});
