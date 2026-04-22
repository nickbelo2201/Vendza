import { prisma } from "@vendza/database";

(async () => {
  const store = await prisma.store.findFirst({ where: { slug: "vendza" } });
  if (!store) { console.log("Store não encontrada"); await prisma.$disconnect(); return; }

  const products = await prisma.product.findMany({
    where: { storeId: store.id },
    select: {
      name: true,
      slug: true,
      imageUrl: true,
      isAvailable: true,
      category: { select: { name: true, slug: true, parentCategoryId: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  console.log(`Total: ${products.length} produtos\n`);
  products.forEach(p => {
    const img = p.imageUrl ? p.imageUrl.substring(0, 50) + "..." : "SEM IMAGEM";
    const cat = p.category ? `${p.category.name} (${p.category.parentCategoryId ? "sub" : "PAI"})` : "SEM CAT";
    console.log(`${p.isAvailable ? "✓" : "✗"} ${p.name}`);
    console.log(`  slug: ${p.slug} | cat: ${cat} | img: ${img}`);
  });

  await prisma.$disconnect();
})();
