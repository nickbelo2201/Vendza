import { prisma } from "./src/index.js";

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, slug: true, status: true }
  });
  console.log("Lojas no sistema:");
  console.log(JSON.stringify(stores, null, 2));

  const bundles = await prisma.productBundle.findMany({
    include: { product: { select: { storeId: true, name: true } } }
  });
  console.log("\nBundles no sistema:");
  bundles.forEach(b => {
    console.log(`  Bundle "${b.name}" → produto "${b.product.name}" → storeId: ${b.product.storeId}`);
  });

  const storeUsers = await prisma.storeUser.findMany({
    where: { email: "nickbelo2201@gmail.com" },
    select: { storeId: true, email: true, role: true, store: { select: { name: true, slug: true } } }
  });
  console.log("\nUsuário nickbelo2201@gmail.com está nas lojas:");
  console.log(JSON.stringify(storeUsers, null, 2));
}

main().then(() => prisma.$disconnect()).catch(console.error);
