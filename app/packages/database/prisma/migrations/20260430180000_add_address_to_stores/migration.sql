-- AlterTable: adiciona campos de endereço à loja
ALTER TABLE "stores"
  ADD COLUMN IF NOT EXISTS "address_street"       TEXT,
  ADD COLUMN IF NOT EXISTS "address_neighborhood" TEXT,
  ADD COLUMN IF NOT EXISTS "address_city"         TEXT,
  ADD COLUMN IF NOT EXISTS "address_state"        TEXT,
  ADD COLUMN IF NOT EXISTS "address_zip_code"     TEXT,
  ADD COLUMN IF NOT EXISTS "address_complement"   TEXT;
