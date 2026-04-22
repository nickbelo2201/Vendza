import { prisma } from "@vendza/database";

(async () => {
  const store = await prisma.store.findFirst({ where: { slug: "vendza" } });
  if (!store) { console.log("Loja 'vendza' não encontrada"); await prisma.$disconnect(); return; }

  console.log(`Loja: ${store.name} (${store.id})`);

  const cats = await prisma.category.count({ where: { storeId: store.id } });
  const rootCats = await prisma.category.count({ where: { storeId: store.id, parentCategoryId: null } });
  console.log(`Categorias: ${cats} total, ${rootCats} raiz`);

  const prods = await prisma.product.count({ where: { storeId: store.id } });
  const withImg = await prisma.product.count({ where: { storeId: store.id, imageUrl: { not: null } } });
  console.log(`Produtos: ${prods} total, ${withImg} com imagem`);

  if (prods > 0) {
    const sample = await prisma.product.findMany({
      where: { storeId: store.id },
      take: 3,
      select: { name: true, imageUrl: true, category: { select: { name: true } } }
    });
    sample.forEach(p => console.log(`  - ${p.name} | cat: ${p.category?.name ?? "SEM"} | img: ${p.imageUrl ? p.imageUrl.substring(0,60)+"..." : "NULL"}`));
  }

  await prisma.$disconnect();
})();
