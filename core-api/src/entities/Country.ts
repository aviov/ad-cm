import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Payout } from "./Payout";

@Entity("countries")
export class Country {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 2, unique: true })
  code: string;

  @Column({ length: 100 })
  name: string;

  @OneToMany(() => Payout, payout => payout.country)
  payouts: Payout[];

  constructor() {
    this.id = 0; // Initialize with a default value
    this.code = "";
    this.name = "";
    this.payouts = [];
  }
}