-- CreateTable
CREATE TABLE "combo_complement_groups" (
    "id" UUID NOT NULL,
    "combo_id" UUID NOT NULL,
    "complement_group_id" UUID NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_required_override" BOOLEAN,
    "min_selection_override" INTEGER,
    "max_selection_override" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "combo_complement_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "combo_complement_groups_combo_id_sort_order_idx" ON "combo_complement_groups"("combo_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "combo_complement_groups_combo_id_complement_group_id_key" ON "combo_complement_groups"("combo_id", "complement_group_id");

-- AddForeignKey
ALTER TABLE "combo_complement_groups" ADD CONSTRAINT "combo_complement_groups_combo_id_fkey" FOREIGN KEY ("combo_id") REFERENCES "combos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "combo_complement_groups" ADD CONSTRAINT "combo_complement_groups_complement_group_id_fkey" FOREIGN KEY ("complement_group_id") REFERENCES "complement_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
