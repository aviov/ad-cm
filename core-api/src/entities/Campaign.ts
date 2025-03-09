import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Payout } from "./Payout";

@Entity("campaigns")
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column("text")
  landingPageUrl: string;

  @Column({ default: false })
  isRunning: boolean;

  @OneToMany(() => Payout, payout => payout.campaign, { cascade: true })
  payouts: Payout[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  constructor() {
    this.id = 0; // Initialize with a default value
    this.title = "";
    this.landingPageUrl = "";
    this.isRunning = false;
    this.payouts = [];
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}