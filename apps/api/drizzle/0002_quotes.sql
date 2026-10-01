CREATE TYPE "public"."analysis_status" AS ENUM('ok', 'unclear', 'not_curtain', 'unavailable', 'failed', 'skipped');--> statement-breakpoint
CREATE TYPE "public"."component_slot" AS ENUM('sheer', 'main', 'lining', 'track', 'cornice');--> statement-breakpoint
CREATE TYPE "public"."component_source" AS ENUM('ai', 'manual');--> statement-breakpoint
CREATE TYPE "public"."line_kind" AS ENUM('fabric', 'labor', 'track', 'cornice', 'installation', 'model_item', 'manual');--> statement-breakpoint
CREATE TYPE "public"."line_source" AS ENUM('system', 'manual');--> statement-breakpoint
CREATE TYPE "public"."quote_event_type" AS ENUM('created', 'photo_added', 'analyzed', 'component_changed', 'priced', 'status_changed', 'sent_whatsapp', 'link_opened', 'pdf_downloaded');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'review', 'sent', 'accepted', 'rejected');--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"phone" text NOT NULL,
	"area" text DEFAULT '' NOT NULL,
	"address" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "clients" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "pricing_rules" (
	"shop_id" uuid PRIMARY KEY NOT NULL,
	"installation_per_window" numeric(12, 2) NOT NULL,
	"cornice_per_meter" numeric(12, 2) NOT NULL,
	"default_top_width_m" numeric(4, 2) NOT NULL,
	"deposit_percent" integer NOT NULL,
	"validity_days" integer NOT NULL,
	"rail_allowance" numeric(4, 2) NOT NULL,
	"flat_allowance" numeric(4, 2) NOT NULL,
	"drop_allowance" numeric(4, 2) NOT NULL,
	"rounding_step" numeric(4, 2) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pricing_rules" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quote_components" (
	"quote_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"slot" "component_slot" NOT NULL,
	"material_id" uuid,
	"included" boolean NOT NULL,
	"source" "component_source" NOT NULL,
	"confidence" integer,
	"ai_material_id" uuid,
	"ai_included" boolean,
	CONSTRAINT "quote_components_quote_id_slot_pk" PRIMARY KEY("quote_id","slot")
);
--> statement-breakpoint
ALTER TABLE "quote_components" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quote_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"type" "quote_event_type" NOT NULL,
	"actor_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quote_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"quote_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"key" text NOT NULL,
	"kind" "line_kind" NOT NULL,
	"label" text NOT NULL,
	"material_id" uuid,
	"quantity" numeric(12, 2) NOT NULL,
	"quantity_label" text NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"unit_cost" numeric(12, 2),
	"line_total" numeric(12, 2) NOT NULL,
	"source" "line_source" NOT NULL,
	"is_edited" boolean DEFAULT false NOT NULL,
	"original_quantity" numeric(12, 2),
	"original_unit_price" numeric(12, 2),
	"sort_order" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "quote_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "quotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"number" integer NOT NULL,
	"client_id" uuid NOT NULL,
	"created_by" uuid,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"room_label" text DEFAULT '' NOT NULL,
	"width_cm" integer,
	"height_cm" integer,
	"window_count" integer DEFAULT 1 NOT NULL,
	"model_id" uuid,
	"model_name" text,
	"model_source" "component_source",
	"model_confidence" integer,
	"ai_model_id" uuid,
	"operation" "operation" DEFAULT 'manual' NOT NULL,
	"optional_item_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"use_default_cornice" boolean DEFAULT false NOT NULL,
	"tier" "tier",
	"photo_paths" text[] DEFAULT '{}'::text[] NOT NULL,
	"analysis_status" "analysis_status",
	"ai_result" jsonb,
	"ai_confidence" integer,
	"edits" jsonb,
	"subtotal" numeric(12, 2) DEFAULT 0 NOT NULL,
	"discount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"total" numeric(12, 2) DEFAULT 0 NOT NULL,
	"deposit_percent" integer DEFAULT 0 NOT NULL,
	"deposit_amount" numeric(12, 2) DEFAULT 0 NOT NULL,
	"valid_until" date,
	"public_token" text NOT NULL,
	"internal_notes" text DEFAULT '' NOT NULL,
	"final_total" numeric(12, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "quotes_public_token_unique" UNIQUE("public_token")
);
--> statement-breakpoint
ALTER TABLE "quotes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "clients" ADD CONSTRAINT "clients_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_rules" ADD CONSTRAINT "pricing_rules_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_components" ADD CONSTRAINT "quote_components_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_components" ADD CONSTRAINT "quote_components_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_components" ADD CONSTRAINT "quote_components_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_events" ADD CONSTRAINT "quote_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_quote_id_quotes_id_fk" FOREIGN KEY ("quote_id") REFERENCES "public"."quotes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quote_items" ADD CONSTRAINT "quote_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_model_id_curtain_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."curtain_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_shop_phone_idx" ON "clients" USING btree ("shop_id","phone");--> statement-breakpoint
CREATE INDEX "quote_events_quote_idx" ON "quote_events" USING btree ("quote_id");--> statement-breakpoint
CREATE INDEX "quote_items_quote_idx" ON "quote_items" USING btree ("quote_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quotes_shop_number_idx" ON "quotes" USING btree ("shop_id","number");--> statement-breakpoint
CREATE INDEX "quotes_shop_status_idx" ON "quotes" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "quotes_client_idx" ON "quotes" USING btree ("client_id");