import { prisma } from "@vendza/database";

(async () => {
  const store = await prisma.store.findFirst({ where: { slug: "demo-adega-mercado" } });
  if (!store) {
    console.log("Store não encontrada");
    await prisma.$disconnect();
    return;
  }

  const total = await prisma.category.count({ where: { storeId: store.id } });
  const subs = await prisma.category.count({
    where: { storeId: store.id, parentCategoryId: { not: null } }
  });

  console.log(`Store: ${store.name} (${store.id})`);
  console.log(`Categorias: ${total} total, ${total - subs} pais, ${subs} subcategorias`);

  if (total > 0) {
    const parents = await prisma.category.findMany({
      where: { storeId: store.id, parentCategoryId: null },
      select: { name: true }
    });
    console.log("\nCategorias pai:");
    parents.forEach(p => console.log(`- ${p.name}`));
  }

  await prisma.$disconnect();
})();
