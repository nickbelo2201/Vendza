import { prisma } from "@vendza/database";

(async () => {
  const s = await prisma.store.findFirst({ where: { slug: "vendza" } });
  const prods = await prisma.product.findMany({
    where: { storeId: s!.id, imageUrl: { not: null } },
    select: { name: true, imageUrl: true },
    take: 3
  });
  prods.forEach(p => {
    console.log("PRODUTO:", p.name);
    console.log("URL:", p.imageUrl);
    console.log("---");
  });
  await prisma.$disconnect();
})();
