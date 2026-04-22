/**
 * Corrige a loja "vendza":
 * 1. Remove produtos antigos com categorias erradas
 * 2. Remove categorias "Extras" e "Produtos" (antigas)
 * 3. Copia imageUrls da loja "adega" para produtos equivalentes em "vendza" (por slug)
 */
import { prisma } from "@vendza/database";

(async () => {
  const vendza = await prisma.store.findFirst({ where: { slug: "vendza" } });
  const adega = await prisma.store.findFirst({ where: { slug: "adega" } });

  if (!vendza || !adega) {
    console.error("Lojas não encontradas");
    await prisma.$disconnect();
    return;
  }

  // 1. Marcar produtos antigos como indisponíveis (por slug não gerado pelo seed)
  const slugsSeed = [
    "vinho-tinto-cabernet", "vinho-branco-chardonnay", "espumante-brut", "vinho-rose-suave",
    "heineken-long-neck-330ml", "budweiser-lata-350ml", "stella-artois-long-neck",
    "colorado-appia-600ml", "whisky-johnnie-walker-red-750ml", "gin-tanqueray-750ml",
    "cachaca-salinas-ouro-700ml", "vodka-smirnoff-998ml", "agua-mineral-500ml",
    "coca-cola-lata-350ml", "red-bull-250ml",
  ];

  const hiddenProds = await prisma.product.updateMany({
    where: { storeId: vendza.id, slug: { notIn: slugsSeed } },
    data: { isAvailable: false }
  });
  console.log(`✓ ${hiddenProds.count} produtos antigos marcados como indisponíveis`);

  // 2. Deletar categorias antigas sem slug do seed
  const slugsCatSeed = [
    "vinhos", "espumantes", "cervejas", "destilados", "licores-aperitivos",
    "bebidas-sem-alcool", "acessorios",
    "vinho-tinto", "vinho-branco", "vinho-rose", "vinho-laranja",
    "champagne", "prosecco", "cava", "espumante-nacional",
    "lager-pilsen", "ipa", "stout", "weiss-trigo",
    "whisky", "vodka", "gin", "rum", "cachaca", "tequila-mezcal",
    "licor", "aperitivo-bitter",
    "sucos-nectares", "refrigerantes", "agua", "energeticos",
    "tacas-copos", "abridor-saca-rolha", "embalagem-presente",
  ];

  const deletedCats = await prisma.category.deleteMany({
    where: { storeId: vendza.id, slug: { notIn: slugsCatSeed } }
  });
  console.log(`✓ ${deletedCats.count} categorias antigas removidas`);

  // 3. Copiar imageUrls da loja "adega" para equivalentes em "vendza" (por slug)
  const adegaProds = await prisma.product.findMany({
    where: { storeId: adega.id, imageUrl: { not: null } },
    select: { slug: true, imageUrl: true }
  });

  let copied = 0;
  for (const ap of adegaProds) {
    const updated = await prisma.product.updateMany({
      where: { storeId: vendza.id, slug: ap.slug, imageUrl: null },
      data: { imageUrl: ap.imageUrl }
    });
    if (updated.count > 0) {
      console.log(`  ✓ Imagem copiada: ${ap.slug}`);
      copied++;
    }
  }
  console.log(`\n✓ ${copied} imagens copiadas da loja 'adega' para 'vendza'`);

  // Contagem final
  const total = await prisma.product.count({ where: { storeId: vendza.id } });
  const withImg = await prisma.product.count({ where: { storeId: vendza.id, imageUrl: { not: null } } });
  const cats = await prisma.category.count({ where: { storeId: vendza.id } });
  const rootCats = await prisma.category.count({ where: { storeId: vendza.id, parentCategoryId: null } });

  console.log(`\n📊 Resultado final:`);
  console.log(`   Categorias: ${cats} total, ${rootCats} raiz`);
  console.log(`   Produtos: ${total} total, ${withImg} com imagem`);

  await prisma.$disconnect();
})();
