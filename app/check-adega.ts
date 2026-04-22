import { prisma } from "@vendza/database";

(async () => {
  // Verificar loja adega
  const store = await prisma.store.findFirst({ where: { slug: "adega" } });
  if (!store) { console.log("Loja 'adega' não encontrada"); await prisma.$disconnect(); return; }

  console.log(`\nLoja: ${store.name} (${store.id})`);

  // Verificar categorias
  const cats = await prisma.category.findMany({
    where: { storeId: store.id, isActive: true, parentCategoryId: null },
    include: { children: true },
    orderBy: { sortOrder: "asc" },
  });
  console.log(`\nCategorias pai: ${cats.length}`);
  cats.forEach(c => console.log(`- ${c.name} (${c.children.length} filhas)`));

  // Verificar produtos
  const prods = await prisma.product.count({ where: { storeId: store.id } });
  const withImage = await prisma.product.count({
    where: { storeId: store.id, imageUrl: { not: null } }
  });
  console.log(`\nProdutos: ${prods} total, ${withImage} com imagem`);

  // Sample de imagens
  const sample = await prisma.product.findMany({
    where: { storeId: store.id },
    take: 3,
    select: { name: true, imageUrl: true }
  });
  sample.forEach(p => console.log(`- ${p.name}: ${p.imageUrl ? p.imageUrl.substring(0, 80) : "SEM IMAGEM"}`));

  await prisma.$disconnect();
})();
