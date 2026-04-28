import { prisma } from "./src/index.js";

async function main() {
  const storeId = "00144c44-b47e-4e0f-a8fd-0d9fc4897bc8"; // Loja "Adega" (slug: vendza)
  
  // Cerveja Heineken Long Neck 330ml — R$7,50
  const productId = "0ec35b24-1aab-4239-bcff-018387ab5124";

  const existing = await prisma.productBundle.findFirst({ where: { productId } });
  if (existing) {
    console.log("Bundle já existe nesse produto:", JSON.stringify(existing, null, 2));
    await prisma.$disconnect();
    return;
  }

  const bundle = await prisma.productBundle.create({
    data: {
      productId,
      name: "Fardo 6 unidades",
      slug: "heineken-330ml-fardo-6",
      bundlePriceCents: 3900, // R$39,00 para 6 (avulso: 6 × R$7,50 = R$45,00 → 13% off)
      itemsJson: { quantity: 6 },
      isAvailable: true,
    }
  });
  console.log("Bundle criado na loja Adega (vendza):", JSON.stringify(bundle, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
