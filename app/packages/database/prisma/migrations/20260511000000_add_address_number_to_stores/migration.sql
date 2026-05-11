-- AlterTable: adiciona número do estabelecimento ao endereço da loja
ALTER TABLE "stores" ADD COLUMN IF NOT EXISTS "address_number" TEXT;
