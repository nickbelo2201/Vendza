import { prisma } from "@vendza/database";
import { applyTemplatesToStore } from "./apps/api/src/modules/onboarding/service.js";

(async () => {
  const store = await prisma.store.findFirst({ where: { slug: "adega" } });
  if (!store) { console.log("Store 'adega' não encontrada"); await prisma.$disconnect(); return; }

  console.log(`\nLoja: ${store.name} (${store.id})`);

  const rootCatsBefore = await prisma.category.count({ where: { storeId: store.id, parentCategoryId: null } });
  console.log(`Categorias raiz antes: ${rootCatsBefore}`);

  console.log("Aplicando templates adega + mercado...");
  const result = await applyTemplatesToStore(store.id, ["adega", "mercado"]);
  console.log(`${result.appliedCategories} categorias criadas`);

  const rootCatsAfter = await prisma.category.count({ where: { storeId: store.id, parentCategoryId: null } });
  const total = await prisma.category.count({ where: { storeId: store.id } });
  console.log(`\nCategorias raiz depois: ${rootCatsAfter}`);
  console.log(`Total de categorias: ${total}`);

  // Listar todas as raiz
  const cats = await prisma.category.findMany({
    where: { storeId: store.id, parentCategoryId: null, isActive: true },
    select: { name: true, slug: true, children: { select: { name: true }, where: { isActive: true } } },
    orderBy: { sortOrder: "asc" },
  });
  for (const c of cats) {
    console.log(`  ${c.name} (${c.slug}) - ${c.children.length} subs`);
  }

  await prisma.$disconnect();
})();
