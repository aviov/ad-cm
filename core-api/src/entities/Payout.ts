import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Campaign } from "./Campaign";
import { Country } from "./Country";

@Entity("payouts")
export class Payout {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  budget!: number;

  @Column({ default: false })
  autoStop!: boolean;

  @Column({ default: false })
  budgetAlert!: boolean;

  @Column({ nullable: true })
  budgetAlertEmail!: string;

  @ManyToOne(() => Campaign, campaign => campaign.payouts, { onDelete: "CASCADE" })
  @JoinColumn({ name: "campaign_id" })
  campaign!: Campaign;

  // Explicit column for the foreign key
  @Column({ name: "country_id", nullable: true })
  countryId!: number;

  @ManyToOne(() => Country, country => country.payouts)
  @JoinColumn({ name: "country_id" })
  country!: Country;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor() {
    this.amount = 0;
    this.budget = 0;
    this.autoStop = false;
    this.budgetAlert = false;
    this.budgetAlertEmail = "";
    // Do not initialize campaign and country - TypeORM will handle these relationships
    // No need to initialize createdAt/updatedAt - TypeORM handles these
  }
}