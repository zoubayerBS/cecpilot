CREATE TABLE "cecschema"."utilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" text NOT NULL,
	"item" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "utilities_category_item_unique" UNIQUE("category","item")
);
