CREATE TYPE "public"."curtain_style" AS ENUM('pinch_pleat', 'eyelet', 'wave', 'pencil_pleat', 'roman', 'roller', 'other');--> statement-breakpoint
CREATE TYPE "public"."item_basis" AS ENUM('per_window', 'per_fabric_meter', 'per_side', 'per_width_meter');--> statement-breakpoint
CREATE TYPE "public"."material_layer" AS ENUM('sheer', 'main', 'lining', 'track', 'accessory', 'motor');--> statement-breakpoint
CREATE TYPE "public"."material_unit" AS ENUM('meter', 'linear_meter', 'piece');--> statement-breakpoint
CREATE TYPE "public"."model_item_kind" AS ENUM('operation', 'accessory');--> statement-breakpoint
CREATE TYPE "public"."operation" AS ENUM('manual', 'motorized');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'credit');--> statement-breakpoint
CREATE TYPE "public"."pricing_method" AS ENUM('linear_fullness', 'square_meter', 'piece');--> statement-breakpoint
CREATE TYPE "public"."stock_status" AS ENUM('available', 'low', 'out');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('economy', 'standard', 'premium');--> statement-breakpoint
CREATE TABLE "curtain_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"pricing_method" "pricing_method" NOT NULL,
	"fullness" numeric(4, 2) DEFAULT 1 NOT NULL,
	"labor_per_unit" numeric(12, 2) DEFAULT 0 NOT NULL,
	"operation" "operation" DEFAULT 'manual' NOT NULL,
	"style" "curtain_style" DEFAULT 'other' NOT NULL,
	"technician_note" text DEFAULT '' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "curtain_models" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"layer" "material_layer" NOT NULL,
	"look" text,
	"tier" "tier" DEFAULT 'standard' NOT NULL,
	"unit" "material_unit" DEFAULT 'meter' NOT NULL,
	"supplier_id" uuid,
	"supplier_code" text DEFAULT '' NOT NULL,
	"purchase_price" numeric(12, 2),
	"sell_price" numeric(12, 2) NOT NULL,
	"top_width_m" numeric(4, 2),
	"stock_status" "stock_status" DEFAULT 'available' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "materials" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "model_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"model_id" uuid NOT NULL,
	"kind" "model_item_kind" NOT NULL,
	"material_id" uuid,
	"label" text NOT NULL,
	"unit_price" numeric(12, 2),
	"basis" "item_basis" DEFAULT 'per_window' NOT NULL,
	"quantity" numeric(8, 2) DEFAULT 1 NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "model_items" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"specialty" text DEFAULT '' NOT NULL,
	"contact_name" text DEFAULT '' NOT NULL,
	"whatsapp" text,
	"address" text DEFAULT '' NOT NULL,
	"payment_method" "payment_method" DEFAULT 'cash' NOT NULL,
	"credit_days" integer,
	"lead_time_min_days" integer,
	"lead_time_max_days" integer,
	"prices_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "suppliers" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "curtain_models" ADD CONSTRAINT "curtain_models_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "materials" ADD CONSTRAINT "materials_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_items" ADD CONSTRAINT "model_items_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_items" ADD CONSTRAINT "model_items_model_id_curtain_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."curtain_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_items" ADD CONSTRAINT "model_items_material_id_materials_id_fk" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "curtain_models_shop_idx" ON "curtain_models" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "materials_shop_layer_idx" ON "materials" USING btree ("shop_id","layer");--> statement-breakpoint
CREATE INDEX "materials_supplier_idx" ON "materials" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "model_items_model_idx" ON "model_items" USING btree ("model_id");--> statement-breakpoint
CREATE UNIQUE INDEX "suppliers_shop_name_idx" ON "suppliers" USING btree ("shop_id","name");