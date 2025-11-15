
CREATE TABLE IF NOT EXISTS "cec_forms" (
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

CREATE TABLE IF NOT EXISTS "sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text UNIQUE,
	"username" text,
	"expires" timestamp,
	"created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text UNIQUE,
	"password" text
);

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert admin user with a hashed password.
-- The password is 'admin'.
INSERT INTO cecschema.users (username, password) VALUES ('admin', crypt('admin', gen_salt('bf')));

