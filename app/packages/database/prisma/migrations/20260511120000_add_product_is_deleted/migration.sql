-- AlterTable: adiciona flag de deleção lógica ao produto
ALTER TABLE "products" ADD COLUMN "is_deleted" BOOLEAN NOT NULL DEFAULT false;
-- CreateIndex
CREATE INDEX "products_store_id_is_deleted_idx" ON "products"("store_id", "is_deleted");
