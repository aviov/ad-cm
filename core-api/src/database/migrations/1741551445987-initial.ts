import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1741551445987 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create campaigns table
        await queryRunner.query(`
            CREATE TABLE "campaigns" (
                "id" SERIAL PRIMARY KEY,
                "title" character varying(255) NOT NULL,
                "landingPageUrl" text NOT NULL,
                "isRunning" boolean DEFAULT false NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
            )
        `);
    
        // Create countries table
        await queryRunner.query(`
            CREATE TABLE "countries" (
                "id" SERIAL PRIMARY KEY,
                "code" character varying(2) NOT NULL UNIQUE,
                "name" character varying(100) NOT NULL
            )
        `);
    
        // Create payouts table
        await queryRunner.query(`
            CREATE TABLE "payouts" (
                "id" SERIAL PRIMARY KEY,
                "amount" numeric(10,2) NOT NULL,
                "budget" numeric(10,2),
                "autoStop" boolean DEFAULT false NOT NULL,
                "budgetAlert" boolean DEFAULT false NOT NULL,
                "budgetAlertEmail" character varying,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                "campaign_id" integer,
                "country_id" integer,
                CONSTRAINT "FK_97c1cfa1041a2ce49fca57d758f" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_4e429f84d570c893957da52c2f7" FOREIGN KEY ("country_id") REFERENCES "countries"("id")
            )
        `);
        return Promise.resolve();
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to avoid foreign key constraints
        await queryRunner.query(`DROP TABLE "payouts"`);
        await queryRunner.query(`DROP TABLE "countries"`);
        await queryRunner.query(`DROP TABLE "campaigns"`);
        return Promise.resolve();
    }

}
