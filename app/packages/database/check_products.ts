import { prisma } from "./src/index.js";

async function main() {
  // Loja "Adega" (slug: vendza) — a loja principal do usuário
  const storeId = "00144c44-b47e-4e0f-a8fd-0d9fc4897bc8";
  
  const produtos = await prisma.product.findMany({
    where: { storeId, isAvailable: true },
    select: { id: true, name: true, listPriceCents: true, salePriceCents: true },
    orderBy: { name: "asc" },
    take: 20,
  });
  
  console.log("Produtos na loja Adega (vendza):");
  produtos.forEach(p => {
    console.log(`  ${p.id} | ${p.name} | R$${(p.listPriceCents/100).toFixed(2)}`);
  });
}

main().then(() => prisma.$disconnect()).catch(console.error);
