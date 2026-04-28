-- CreateTable
CREATE TABLE "combo_extras" (
    "id" UUID NOT NULL,
    "combo_id" UUID NOT NULL,
    "extra_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "combo_extras_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "combo_extras_combo_id_extra_id_key" ON "combo_extras"("combo_id", "extra_id");

-- AddForeignKey
ALTER TABLE "combo_extras" ADD CONSTRAINT "combo_extras_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_extras" ADD CONSTRAINT "combo_extras_extra_id_fkey" FOREIGN KEY ("extra_id") REFERENCES "extras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
