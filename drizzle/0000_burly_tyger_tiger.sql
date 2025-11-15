CREATE SCHEMA "cecschema";
--> statement-breakpoint
CREATE TABLE "cecschema"."cec_forms" (
	"id" serial PRIMARY KEY NOT NULL,
	"patient_info" jsonb,
	"team_info" jsonb,
	"pre_op_bilan" jsonb,
	"materiel" jsonb,
	"deroulement" jsonb,
	"blood_gas" jsonb,
	"timeline" jsonb,
	"cardioplegia" jsonb,
	"hemodynamic_monitoring" jsonb,
	"blood_products" jsonb,
	"balance_io" jsonb,
	"examens_complementaires" jsonb,
	"observations" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cecschema"."sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text,
	"username" text,
	"expires" timestamp,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "cecschema"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text,
	"password" text,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
