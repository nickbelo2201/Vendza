-- CreateEnum
CREATE TYPE "StoreStatus" AS ENUM ('open', 'closed', 'paused');

-- CreateEnum
CREATE TYPE "StoreUserRole" AS ENUM ('owner', 'manager', 'operator');

-- CreateEnum
CREATE TYPE "DeliveryZoneMode" AS ENUM ('radius', 'neighborhoods', 'neighborhood_radius');

-- CreateEnum
CREATE TYPE "InventoryMovementType" AS ENUM ('manual_adjustment', 'replenishment', 'sale', 'cancellation');

-- CreateEnum
CREATE TYPE "OrderChannel" AS ENUM ('web', 'whatsapp', 'manual', 'balcao');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'preparing', 'ready_for_delivery', 'out_for_delivery', 'delivered', 'cancelled');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('pix', 'cash', 'card_on_delivery', 'card_online');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'authorized', 'paid', 'failed', 'refunded');

-- CreateTable
CREATE TABLE "tenants" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stores" (
    "id" UUID NOT NULL,
    "tenant_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "whatsapp_phone" TEXT NOT NULL,
    "status" "StoreStatus" NOT NULL DEFAULT 'closed',
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "minimum_order_value_cents" INTEGER NOT NULL DEFAULT 0,
    "logo_url" TEXT,
    "primary_color" TEXT,
    "support_email" TEXT,
    "template_ids" TEXT NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixa_turnos" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "abreu_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechou_em" TIMESTAMP(3),
    "aberto_por" UUID NOT NULL,
    "fechado_por" UUID,
    "saldo_inicial" INTEGER NOT NULL,
    "saldo_final" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "caixa_turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_users" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "auth_user_id" UUID,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "StoreUserRole" NOT NULL DEFAULT 'operator',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_hours" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "weekday" INTEGER NOT NULL,
    "opens_at" TEXT NOT NULL,
    "closes_at" TEXT NOT NULL,
    "is_closed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "store_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "store_bank_accounts" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "key_type" TEXT NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "last_four_digits" TEXT NOT NULL,
    "bank_name" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_user_id" UUID,

    CONSTRAINT "store_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "delivery_zones" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "mode" "DeliveryZoneMode" NOT NULL DEFAULT 'neighborhood_radius',
    "neighborhoods_json" JSONB NOT NULL,
    "center_lat" DOUBLE PRECISION,
    "center_lng" DOUBLE PRECISION,
    "radius_meters" INTEGER,
    "delivery_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "minimum_order_value_cents" INTEGER NOT NULL DEFAULT 0,
    "estimated_delivery_minutes" INTEGER NOT NULL DEFAULT 45,
    "free_shipping_above_cents" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "birth_date" DATE,
    "last_order_at" TIMESTAMP(3),
    "total_spent_cents" INTEGER NOT NULL DEFAULT 0,
    "is_inactive" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "label" TEXT,
    "recipient_name" TEXT,
    "phone" TEXT,
    "street" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "complement" TEXT,
    "neighborhood" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postal_code" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_notes" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_tags" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "parent_category_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "category_id" UUID,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "image_url" TEXT,
    "list_price_cents" INTEGER NOT NULL,
    "sale_price_cents" INTEGER,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "barcode" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT,
    "unit_label" TEXT,
    "volume_ml" INTEGER,
    "list_price_cents" INTEGER NOT NULL,
    "sale_price_cents" INTEGER,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_bundles" (
    "id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bundle_price_cents" INTEGER NOT NULL,
    "items_json" JSONB NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_bundles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_items" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "current_stock" INTEGER NOT NULL DEFAULT 0,
    "safety_stock" INTEGER NOT NULL DEFAULT 0,
    "allow_backorder" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_movements" (
    "id" UUID NOT NULL,
    "inventory_item_id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "type" "InventoryMovementType" NOT NULL,
    "quantity_delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "store_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "public_id" TEXT NOT NULL,
    "channel" "OrderChannel" NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "payment_method" "PaymentMethod" NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "customer_email" TEXT,
    "delivery_street" TEXT NOT NULL,
    "delivery_number" TEXT NOT NULL,
    "delivery_complement" TEXT,
    "delivery_neighborhood" TEXT NOT NULL,
    "delivery_city" TEXT NOT NULL,
    "delivery_state" TEXT NOT NULL,
    "delivery_postal_code" TEXT NOT NULL,
    "delivery_lat" DOUBLE PRECISION,
    "delivery_lng" DOUBLE PRECISION,
    "subtotal_cents" INTEGER NOT NULL,
    "delivery_fee_cents" INTEGER NOT NULL DEFAULT 0,
    "discount_cents" INTEGER NOT NULL DEFAULT 0,
    "total_cents" INTEGER NOT NULL,
    "notes" TEXT,
    "placed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "product_id" UUID NOT NULL,
    "variant_id" UUID,
    "product_name" TEXT NOT NULL,
    "variant_name" TEXT,
    "quantity" INTEGER NOT NULL,
    "unit_price_cents" INTEGER NOT NULL,
    "total_price_cents" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_events" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload_json" JSONB NOT NULL,
    "created_by_user_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_payments" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "provider" TEXT NOT NULL,
    "provider_reference" TEXT,
    "amount_cents" INTEGER NOT NULL,
    "raw_payload" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "stores_slug_key" ON "stores"("slug");

-- CreateIndex
CREATE INDEX "stores_tenant_id_idx" ON "stores"("tenant_id");

-- CreateIndex
CREATE INDEX "caixa_turnos_store_id_idx" ON "caixa_turnos"("store_id");

-- CreateIndex
CREATE INDEX "store_users_store_id_role_idx" ON "store_users"("store_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "store_users_store_id_email_key" ON "store_users"("store_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "store_hours_store_id_weekday_key" ON "store_hours"("store_id", "weekday");

-- CreateIndex
CREATE UNIQUE INDEX "store_bank_accounts_store_id_key" ON "store_bank_accounts"("store_id");

-- CreateIndex
CREATE INDEX "delivery_zones_store_id_is_active_idx" ON "delivery_zones"("store_id", "is_active");

-- CreateIndex
CREATE INDEX "customers_store_id_last_order_at_idx" ON "customers"("store_id", "last_order_at");

-- CreateIndex
CREATE INDEX "customers_store_id_is_inactive_idx" ON "customers"("store_id", "is_inactive");

-- CreateIndex
CREATE UNIQUE INDEX "customers_store_id_phone_key" ON "customers"("store_id", "phone");

-- CreateIndex
CREATE INDEX "customer_addresses_customer_id_is_primary_idx" ON "customer_addresses"("customer_id", "is_primary");

-- CreateIndex
CREATE INDEX "customer_notes_customer_id_created_at_idx" ON "customer_notes"("customer_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "customer_tags_customer_id_label_key" ON "customer_tags"("customer_id", "label");

-- CreateIndex
CREATE INDEX "categories_store_id_is_active_sort_order_idx" ON "categories"("store_id", "is_active", "sort_order");

-- CreateIndex
CREATE INDEX "categories_store_id_parent_category_id_idx" ON "categories"("store_id", "parent_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_store_id_slug_key" ON "categories"("store_id", "slug");

-- CreateIndex
CREATE INDEX "products_store_id_category_id_is_available_idx" ON "products"("store_id", "category_id", "is_available");

-- CreateIndex
CREATE INDEX "products_store_id_barcode_idx" ON "products"("store_id", "barcode");

-- CreateIndex
CREATE UNIQUE INDEX "products_store_id_slug_key" ON "products"("store_id", "slug");

-- CreateIndex
CREATE INDEX "product_variants_product_id_is_available_idx" ON "product_variants"("product_id", "is_available");

-- CreateIndex
CREATE UNIQUE INDEX "product_bundles_product_id_slug_key" ON "product_bundles"("product_id", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_product_id_key" ON "inventory_items"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_items_store_id_product_id_key" ON "inventory_items"("store_id", "product_id");

-- CreateIndex
CREATE INDEX "inventory_movements_store_id_created_at_idx" ON "inventory_movements"("store_id", "created_at");

-- CreateIndex
CREATE INDEX "inventory_movements_inventory_item_id_created_at_idx" ON "inventory_movements"("inventory_item_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_store_id_status_placed_at_idx" ON "orders"("store_id", "status", "placed_at");

-- CreateIndex
CREATE INDEX "orders_store_id_customer_id_placed_at_idx" ON "orders"("store_id", "customer_id", "placed_at");

-- CreateIndex
CREATE UNIQUE INDEX "orders_store_id_public_id_key" ON "orders"("store_id", "public_id");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_events_order_id_created_at_idx" ON "order_events"("order_id", "created_at");

-- CreateIndex
CREATE INDEX "order_payments_order_id_status_idx" ON "order_payments"("order_id", "status");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixa_turnos" ADD CONSTRAINT "caixa_turnos_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_users" ADD CONSTRAINT "store_users_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_hours" ADD CONSTRAINT "store_hours_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "store_bank_accounts" ADD CONSTRAINT "store_bank_accounts_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "delivery_zones" ADD CONSTRAINT "delivery_zones_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_addresses" ADD CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_notes" ADD CONSTRAINT "customer_notes_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_tags" ADD CONSTRAINT "customer_tags_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_category_id_fkey" FOREIGN KEY ("parent_category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_bundles" ADD CONSTRAINT "product_bundles_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_inventory_item_id_fkey" FOREIGN KEY ("inventory_item_id") REFERENCES "inventory_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_movements" ADD CONSTRAINT "inventory_movements_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_store_id_fkey" FOREIGN KEY ("store_id") REFERENCES "stores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_events" ADD CONSTRAINT "order_events_created_by_user_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "store_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payments" ADD CONSTRAINT "order_payments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

