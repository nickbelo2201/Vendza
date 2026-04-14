import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

import {
  DeliveryZoneMode,
  InventoryMovementType,
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  prisma,
  StoreStatus,
  StoreUserRole,
} from "../src/index.js";

function resolveEnvPath() {
  let currentDir = dirname(fileURLToPath(import.meta.url));

  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = resolve(currentDir, ".env");
    if (existsSync(candidate)) {
      return candidate;
    }
    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) {
      break;
    }
    currentDir = parentDir;
  }

  return resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
}

config({ path: resolveEnvPath() });

// ─── Configuração via .env ───────────────────────────────────────────────────
// Para linkar sua conta real:
//   SEED_OWNER_AUTH_USER_ID = UUID do seu usuário no Supabase
//   SEED_OWNER_EMAIL        = seu email cadastrado no Supabase
//   SEED_STORE_SLUG         = slug da sua loja (ex: adega-carlos)
//   SEED_STORE_NAME         = nome da sua loja (ex: Adega do Carlos)
//   SEED_STORE_WHATSAPP     = WhatsApp com DDD e código do país (ex: 5511999999999)

const STORE_SLUG          = process.env.SEED_STORE_SLUG          ?? "adega";
const STORE_NAME          = process.env.SEED_STORE_NAME          ?? "Adega Central";
const STORE_WHATSAPP      = process.env.SEED_STORE_WHATSAPP      ?? "5511999999999";
const OWNER_AUTH_USER_ID  = process.env.SEED_OWNER_AUTH_USER_ID  ?? "9f6d2e72-6d29-45e8-b6ff-9e9fa0000001";
const OWNER_EMAIL         = process.env.SEED_OWNER_EMAIL         ?? "owner@adega.com";
const OWNER_NAME          = process.env.SEED_OWNER_NAME          ?? "Dono da Adega";

async function main() {
  console.log(`\n🍷 Seed da adega iniciado`);
  console.log(`   Loja: ${STORE_NAME} (slug: ${STORE_SLUG})`);
  console.log(`   Dono: ${OWNER_NAME} <${OWNER_EMAIL}>`);
  console.log(`   authUserId: ${OWNER_AUTH_USER_ID}\n`);

  // ─── Tenant ───────────────────────────────────────────────────────────────

  const tenant = await prisma.tenant.upsert({
    where: { slug: STORE_SLUG },
    update: { name: STORE_NAME, status: "active" },
    create: { name: STORE_NAME, slug: STORE_SLUG, status: "active" },
  });

  // ─── Store ────────────────────────────────────────────────────────────────

  const store = await prisma.store.upsert({
    where: { slug: STORE_SLUG },
    update: {
      name: STORE_NAME,
      status: StoreStatus.open,
      whatsappPhone: STORE_WHATSAPP,
      minimumOrderValueCents: 3000,
    },
    create: {
      tenantId: tenant.id,
      name: STORE_NAME,
      slug: STORE_SLUG,
      status: StoreStatus.open,
      whatsappPhone: STORE_WHATSAPP,
      minimumOrderValueCents: 3000,
    },
  });

  console.log(`✓ Store: ${store.name} (id: ${store.id})`);

  // ─── StoreUser (dono) ─────────────────────────────────────────────────────

  await prisma.storeUser.upsert({
    where: { storeId_email: { storeId: store.id, email: OWNER_EMAIL } },
    update: {
      authUserId: OWNER_AUTH_USER_ID,
      name: OWNER_NAME,
      role: StoreUserRole.owner,
    },
    create: {
      storeId: store.id,
      authUserId: OWNER_AUTH_USER_ID,
      email: OWNER_EMAIL,
      name: OWNER_NAME,
      role: StoreUserRole.owner,
    },
  });

  console.log(`✓ StoreUser: ${OWNER_NAME} <${OWNER_EMAIL}>`);

  // ─── Categorias ───────────────────────────────────────────────────────────

  const catVinhos = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "vinhos" } },
    update: { name: "Vinhos", sortOrder: 1, isActive: true },
    create: { storeId: store.id, name: "Vinhos", slug: "vinhos", sortOrder: 1, isActive: true },
  });

  const catCervejas = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "cervejas" } },
    update: { name: "Cervejas", sortOrder: 2, isActive: true },
    create: { storeId: store.id, name: "Cervejas", slug: "cervejas", sortOrder: 2, isActive: true },
  });

  const catDestilados = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "destilados" } },
    update: { name: "Destilados", sortOrder: 3, isActive: true },
    create: { storeId: store.id, name: "Destilados", slug: "destilados", sortOrder: 3, isActive: true },
  });

  const catNaoAlcoolicos = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "nao-alcoolicos" } },
    update: { name: "Não Alcoólicos", sortOrder: 4, isActive: true },
    create: { storeId: store.id, name: "Não Alcoólicos", slug: "nao-alcoolicos", sortOrder: 4, isActive: true },
  });

  console.log(`✓ Categorias: Vinhos, Cervejas, Destilados, Não Alcoólicos`);

  // ─── Produtos ────────────────────────────────────────────────────────────
  // Cada produto criado automaticamente ganha um InventoryItem via upsert

  const produtos = [
    // Vinhos
    {
      categoryId: catVinhos.id,
      name: "Vinho Tinto Cabernet Sauvignon",
      slug: "vinho-tinto-cabernet",
      description: "Vinho tinto encorpado, notas de frutas vermelhas e taninos equilibrados. Ideal para carnes e queijos.",
      listPriceCents: 4590,
      salePriceCents: 3990,
      isFeatured: true,
      stock: 24,
    },
    {
      categoryId: catVinhos.id,
      name: "Vinho Branco Chardonnay",
      slug: "vinho-branco-chardonnay",
      description: "Chardonnay fresco e elegante, perfeito para peixes, frutos do mar e aperitivos.",
      listPriceCents: 3990,
      salePriceCents: 3490,
      isFeatured: false,
      stock: 18,
    },
    {
      categoryId: catVinhos.id,
      name: "Espumante Brut",
      slug: "espumante-brut",
      description: "Espumante nacional pelo método Charmat. Bolhas finas, sabor cítrico e refrescante.",
      listPriceCents: 5500,
      salePriceCents: 4890,
      isFeatured: true,
      stock: 12,
    },
    {
      categoryId: catVinhos.id,
      name: "Vinho Rosé Suave",
      slug: "vinho-rose-suave",
      description: "Rosé leve e frutado, levemente adocicado. Harmoniza com saladas e massas leves.",
      listPriceCents: 3800,
      salePriceCents: 3800,
      isFeatured: false,
      stock: 15,
    },
    // Cervejas
    {
      categoryId: catCervejas.id,
      name: "Heineken Long Neck 330ml",
      slug: "heineken-long-neck-330ml",
      description: "A lager holandesa mais famosa do mundo. Refrescante e com amargor suave.",
      listPriceCents: 899,
      salePriceCents: 799,
      isFeatured: true,
      stock: 96,
    },
    {
      categoryId: catCervejas.id,
      name: "Budweiser Lata 350ml",
      slug: "budweiser-lata-350ml",
      description: "A cerveja americana clássica. Leve, refrescante e de fácil consumo.",
      listPriceCents: 649,
      salePriceCents: 599,
      isFeatured: false,
      stock: 72,
    },
    {
      categoryId: catCervejas.id,
      name: "Stella Artois Long Neck 330ml",
      slug: "stella-artois-long-neck",
      description: "A premiada lager belga. Sabor suave com final limpo e refrescante.",
      listPriceCents: 949,
      salePriceCents: 849,
      isFeatured: false,
      stock: 60,
    },
    {
      categoryId: catCervejas.id,
      name: "Colorado Appia 600ml",
      slug: "colorado-appia-600ml",
      description: "Cerveja artesanal com mel e arroz. Sabor único e inconfundível da cervejaria Colorado.",
      listPriceCents: 1990,
      salePriceCents: 1790,
      isFeatured: true,
      stock: 30,
    },
    // Destilados
    {
      categoryId: catDestilados.id,
      name: "Whisky Johnnie Walker Red Label 750ml",
      slug: "whisky-johnnie-walker-red-750ml",
      description: "O whisky blended escocês mais vendido do mundo. Encorpado, com notas de especiarias e baunilha.",
      listPriceCents: 8990,
      salePriceCents: 7990,
      isFeatured: true,
      stock: 20,
    },
    {
      categoryId: catDestilados.id,
      name: "Gin Tanqueray 750ml",
      slug: "gin-tanqueray-750ml",
      description: "Gin londrino premium com quatro ingredientes botânicos. Perfeito para gin tônica.",
      listPriceCents: 7990,
      salePriceCents: 6990,
      isFeatured: false,
      stock: 15,
    },
    {
      categoryId: catDestilados.id,
      name: "Cachaça Salinas Ouro 700ml",
      slug: "cachaca-salinas-ouro-700ml",
      description: "Cachaça artesanal mineira envelhecida em barril de carvalho. Para caipirinha ou pura.",
      listPriceCents: 3500,
      salePriceCents: 3200,
      isFeatured: false,
      stock: 18,
    },
    {
      categoryId: catDestilados.id,
      name: "Vodka Smirnoff 998ml",
      slug: "vodka-smirnoff-998ml",
      description: "A vodka mais vendida do Brasil. Suave, versátil e ideal para drinks.",
      listPriceCents: 4590,
      salePriceCents: 3990,
      isFeatured: false,
      stock: 25,
    },
    // Não Alcoólicos
    {
      categoryId: catNaoAlcoolicos.id,
      name: "Água Mineral 500ml",
      slug: "agua-mineral-500ml",
      description: "Água mineral natural sem gás. Gelada na hora.",
      listPriceCents: 400,
      salePriceCents: 400,
      isFeatured: false,
      stock: 120,
    },
    {
      categoryId: catNaoAlcoolicos.id,
      name: "Coca-Cola Lata 350ml",
      slug: "coca-cola-lata-350ml",
      description: "O refrigerante mais famoso do mundo. Clássico e refrescante.",
      listPriceCents: 550,
      salePriceCents: 550,
      isFeatured: false,
      stock: 48,
    },
    {
      categoryId: catNaoAlcoolicos.id,
      name: "Red Bull Energy Drink 250ml",
      slug: "red-bull-250ml",
      description: "Bebida energética Red Bull. Combina com vodka, gin e whisky.",
      listPriceCents: 990,
      salePriceCents: 890,
      isFeatured: false,
      stock: 36,
    },
  ];

  for (const p of produtos) {
    const produto = await prisma.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: p.slug } },
      update: {
        name: p.name,
        description: p.description,
        categoryId: p.categoryId,
        listPriceCents: p.listPriceCents,
        salePriceCents: p.salePriceCents,
        isAvailable: true,
        isFeatured: p.isFeatured,
      },
      create: {
        storeId: store.id,
        categoryId: p.categoryId,
        name: p.name,
        slug: p.slug,
        description: p.description,
        listPriceCents: p.listPriceCents,
        salePriceCents: p.salePriceCents,
        isAvailable: true,
        isFeatured: p.isFeatured,
      },
    });

    await prisma.inventoryItem.upsert({
      where: { productId: produto.id },
      update: { currentStock: p.stock, safetyStock: 5 },
      create: {
        storeId: store.id,
        productId: produto.id,
        currentStock: p.stock,
        safetyStock: 5,
      },
    });
  }

  console.log(`✓ Produtos: ${produtos.length} criados/atualizados com estoque`);

  // ─── Horários de funcionamento ────────────────────────────────────────────

  await prisma.storeHour.createMany({
    data: Array.from({ length: 7 }).map((_, weekday) => ({
      storeId: store.id,
      weekday,
      opensAt: weekday === 0 ? "12:00" : "10:00", // domingo abre mais tarde
      closesAt: "23:00",
      isClosed: false,
    })),
    skipDuplicates: true,
  });

  console.log(`✓ Horários: seg-sáb 10h–23h / dom 12h–23h`);

  // ─── Zonas de entrega ─────────────────────────────────────────────────────

  await prisma.deliveryZone.upsert({
    where: { id: "6a53ebc2-5b9f-4a8a-b2d5-0d08b3df7770" },
    update: {
      storeId: store.id,
      label: "Bairros próximos",
      deliveryFeeCents: 600,
      neighborhoodsJson: [
        "Centro", "Bela Vista", "Liberdade", "Consolação",
        "República", "Sé", "Santa Cecília", "Campos Elíseos",
      ],
    },
    create: {
      id: "6a53ebc2-5b9f-4a8a-b2d5-0d08b3df7770",
      storeId: store.id,
      label: "Bairros próximos",
      mode: DeliveryZoneMode.neighborhood_radius,
      centerLat: -23.55052,
      centerLng: -46.633308,
      radiusMeters: 3000,
      deliveryFeeCents: 600,
      neighborhoodsJson: [
        "Centro", "Bela Vista", "Liberdade", "Consolação",
        "República", "Sé", "Santa Cecília", "Campos Elíseos",
      ],
    },
  });

  await prisma.deliveryZone.upsert({
    where: { id: "7b64fcd3-6ca0-5b9b-c3e6-1e19c4ef8881" },
    update: {
      storeId: store.id,
      label: "Região expandida",
      deliveryFeeCents: 1200,
      neighborhoodsJson: [
        "Pinheiros", "Vila Madalena", "Itaim Bibi", "Jardins",
        "Moema", "Vila Mariana", "Brooklin", "Santo André",
      ],
    },
    create: {
      id: "7b64fcd3-6ca0-5b9b-c3e6-1e19c4ef8881",
      storeId: store.id,
      label: "Região expandida",
      mode: DeliveryZoneMode.neighborhood_radius,
      centerLat: -23.55052,
      centerLng: -46.633308,
      radiusMeters: 8000,
      deliveryFeeCents: 1200,
      neighborhoodsJson: [
        "Pinheiros", "Vila Madalena", "Itaim Bibi", "Jardins",
        "Moema", "Vila Mariana", "Brooklin", "Santo André",
      ],
    },
  });

  console.log(`✓ Zonas de entrega: 2 zonas configuradas`);

  // ─── Cliente e pedido de exemplo ─────────────────────────────────────────

  const cliente = await prisma.customer.upsert({
    where: { storeId_phone: { storeId: store.id, phone: "5511988887777" } },
    update: { name: "Cliente Demo", email: "cliente@demo.com", totalSpentCents: 8790 },
    create: {
      storeId: store.id,
      name: "Cliente Demo",
      phone: "5511988887777",
      email: "cliente@demo.com",
      totalSpentCents: 8790,
      isInactive: false,
    },
  });

  const pedidoExistente = await prisma.order.findFirst({
    where: { storeId: store.id, publicId: "PED-0001" },
  });

  if (!pedidoExistente) {
    const primeiroproduto = await prisma.product.findFirst({
      where: { storeId: store.id, slug: "heineken-long-neck-330ml" },
    });

    if (primeiroproduto) {
      const pedido = await prisma.order.create({
        data: {
          storeId: store.id,
          customerId: cliente.id,
          publicId: "PED-0001",
          channel: OrderChannel.web,
          status: OrderStatus.delivered,
          paymentMethod: PaymentMethod.pix,
          paymentStatus: PaymentStatus.paid,
          customerName: cliente.name,
          customerPhone: cliente.phone,
          customerEmail: cliente.email ?? "",
          deliveryStreet: "Rua das Flores",
          deliveryNumber: "42",
          deliveryNeighborhood: "Centro",
          deliveryCity: "São Paulo",
          deliveryState: "SP",
          deliveryPostalCode: "01000000",
          subtotalCents: 799,
          deliveryFeeCents: 600,
          discountCents: 0,
          totalCents: 1399,
          notes: "Pedido demo do seed",
        },
      });

      await prisma.orderItem.create({
        data: {
          orderId: pedido.id,
          productId: primeiroproduto.id,
          productName: primeiroproduto.name,
          quantity: 1,
          unitPriceCents: 799,
          totalPriceCents: 799,
        },
      });

      await prisma.orderEvent.create({
        data: {
          orderId: pedido.id,
          type: "order.created",
          payloadJson: { status: OrderStatus.delivered, source: "seed" },
        },
      });
    }
  }

  console.log(`✓ Cliente e pedido de exemplo criados`);
  console.log(`\n✅ Seed concluído com sucesso!\n`);
  console.log(`   Próximos passos:`);
  console.log(`   1. Atualize STORE_SLUG="${STORE_SLUG}" no Vercel (web-client)`);
  console.log(`   2. Acesse o web-partner e faça login com: ${OWNER_EMAIL}`);
  console.log(`      Se o authUserId ainda for o placeholder, atualize SEED_OWNER_AUTH_USER_ID no .env e rode o seed novamente.\n`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
