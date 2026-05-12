import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

import { prisma } from "../src/index.js";

function resolveEnvPath() {
  let currentDir = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = resolve(currentDir, ".env");
    if (existsSync(candidate)) return candidate;
    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return null;
}

const envPath = resolveEnvPath();
if (envPath) config({ path: envPath });

const STORE_SLUG = "adega";

async function resetAdegaIdeal() {
  const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) throw new Error(`Loja com slug "${STORE_SLUG}" não encontrada`);

  const { id: storeId, name } = store;
  console.log(`\n🎯 Resetando loja: ${name} (${storeId})\n`);

  // 1. Caixa turnos
  const ct = await prisma.caixaTurno.deleteMany({ where: { storeId } });
  console.log(`  ✓ caixa_turnos: ${ct.count} deletados`);

  // 2. Orders (cascades: order_items, order_events, order_payments)
  const ord = await prisma.order.deleteMany({ where: { storeId } });
  console.log(`  ✓ orders (+ items/events/payments): ${ord.count} deletados`);

  // 3. Customers (cascades: customer_addresses, customer_notes, customer_tags)
  const cust = await prisma.customer.deleteMany({ where: { storeId } });
  console.log(`  ✓ customers: ${cust.count} deletados`);

  // 4. Inventory (movements cascade from items)
  const inv = await prisma.inventoryItem.deleteMany({ where: { storeId } });
  console.log(`  ✓ inventory_items (+ movements): ${inv.count} deletados`);

  // 5. Combos (cascades: combo_items, combo_complement_groups, combo_extras)
  const combo = await prisma.combo.deleteMany({ where: { storeId } });
  console.log(`  ✓ combos: ${combo.count} deletados`);

  // 6. Complements (antes de complement_groups)
  const compl = await prisma.complement.deleteMany({ where: { storeId } });
  console.log(`  ✓ complements: ${compl.count} deletados`);

  // 7. Complement groups
  const cg = await prisma.complementGroup.deleteMany({ where: { storeId } });
  console.log(`  ✓ complement_groups: ${cg.count} deletados`);

  // 8. Extras
  const ext = await prisma.extra.deleteMany({ where: { storeId } });
  console.log(`  ✓ extras: ${ext.count} deletados`);

  // 9. Products — hard delete (order_items já foram apagados via cascade dos orders)
  const prod = await prisma.product.deleteMany({ where: { storeId } });
  console.log(`  ✓ products: ${prod.count} deletados`);

  // 10. Categories (SetNull em children e products — pode deletar tudo de uma vez)
  const cat = await prisma.category.deleteMany({ where: { storeId } });
  console.log(`  ✓ categories: ${cat.count} deletadas`);

  console.log(`\n✅ Reset concluído. Loja "${name}" limpa e pronta.\n`);
}

resetAdegaIdeal()
  .catch((err) => {
    console.error("❌ Erro no reset:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
