import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Campaign } from "./Campaign";
import { Country } from "./Country";

@Entity("payouts")
export class Payout {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  budget: number;

  @Column({ default: false })
  autoStop: boolean;

  @Column({ default: false })
  budgetAlert: boolean;

  @Column({ nullable: true })
  budgetAlertEmail: string;

  @ManyToOne(() => Campaign, campaign => campaign.payouts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "campaign_id" })
  campaign: Campaign;

  @ManyToOne(() => Country, country => country.payouts)
  @JoinColumn({ name: "country_id" })
  country: Country;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor() {
    this.id = 0; // Initialize with a default value
    this.amount = 0;
    this.budget = 0;
    this.autoStop = false;
    this.budgetAlert = false;
    this.budgetAlertEmail = "";
    this.campaign = new Campaign(); // Initialize with a default value
    this.country = new Country(); // Initialize with a default value
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}