import { prisma } from "@vendza/database";

(async () => {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, slug: true, status: true },
    orderBy: { createdAt: "asc" }
  });
  console.log("Lojas no banco:");
  stores.forEach(s => console.log(`- ${s.name} (slug: ${s.slug}, status: ${s.status})`));
  await prisma.$disconnect();
})();
