import { prisma } from "@vendza/database";

(async () => {
  const store = await prisma.store.findFirst({ where: { slug: "vendza" } });
  if (!store) { console.log("STORE NOT FOUND"); await prisma.$disconnect(); return; }
  console.log("Store:", store.name, store.id);

  const rootCats = await prisma.category.count({
    where: { storeId: store.id, parentCategoryId: null, isActive: true },
  });
  const total = await prisma.category.count({ where: { storeId: store.id } });
  console.log("Root cats (active):", rootCats);
  console.log("Total cats:", total);

  const cats = await prisma.category.findMany({
    where: { storeId: store.id, isActive: true, parentCategoryId: null },
    select: { name: true, slug: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log("Categorias raiz:", JSON.stringify(cats, null, 2));

  await prisma.$disconnect();
})();
