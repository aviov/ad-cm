import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { Payout } from "./Payout";

@Entity("campaigns")
export class Campaign {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 255 })
  title!: string;

  @Column("text")
  landingPageUrl!: string;

  @Column({ default: false })
  isRunning!: boolean;

  @OneToMany(() => Payout, payout => payout.campaign, { cascade: true })
  payouts!: Payout[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor() {
    this.title = "";
    this.landingPageUrl = "";
    this.isRunning = false;
    // Do not initialize payouts array - TypeORM will handle it
    // No need to initialize createdAt/updatedAt - TypeORM handles these
  }
}