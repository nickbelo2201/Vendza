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

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "vendza" },
    update: {
      name: "Vendza",
      status: "active",
    },
    create: {
      name: "Vendza",
      slug: "vendza",
      status: "active",
    },
  });

  const store = await prisma.store.upsert({
    where: { slug: "vendza" },
    update: {
      name: "Vendza App",
      status: StoreStatus.open,
      whatsappPhone: "+5511999999999",
      minimumOrderValueCents: 3000,
    },
    create: {
      tenantId: tenant.id,
      name: "Vendza App",
      slug: "vendza",
      status: StoreStatus.open,
      whatsappPhone: "+5511999999999",
      minimumOrderValueCents: 3000,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_email: {
        storeId: store.id,
        email: "owner@vendza.com",
      },
    },
    update: {
      name: "INF Owner",
      role: StoreUserRole.owner,
    },
    create: {
      storeId: store.id,
      authUserId: "9f6d2e72-6d29-45e8-b6ff-9e9fa0000001",
      email: "owner@vendza.com",
      name: "INF Owner",
      role: StoreUserRole.owner,
    },
  });

  const beersCategory = await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "cervejas" } },
    update: { name: "Produtos" },
    create: {
      storeId: store.id,
      name: "Produtos",
      slug: "cervejas",
      sortOrder: 1,
    },
  });

  await prisma.category.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "destilados" } },
    update: { name: "Destilados" },
    create: {
      storeId: store.id,
      name: "Extras",
      slug: "extras",
      sortOrder: 2,
    },
  });

  await prisma.product.upsert({
    where: { storeId_slug: { storeId: store.id, slug: "heineken-long-neck" } },
    update: {
      name: "Heineken Long Neck",
      isFeatured: true,
    },
    create: {
      storeId: store.id,
      categoryId: beersCategory.id,
      name: "Heineken Long Neck",
      slug: "heineken-long-neck",
      description: "Produto premium para o comércio piloto.",
      listPriceCents: 899,
      salePriceCents: 799,
      isAvailable: true,
      isFeatured: true,
    },
  });

  const featuredProduct = await prisma.product.findUniqueOrThrow({
    where: { storeId_slug: { storeId: store.id, slug: "heineken-long-neck" } },
  });

  await prisma.storeHour.createMany({
    data: Array.from({ length: 7 }).map((_, weekday) => ({
      storeId: store.id,
      weekday,
      opensAt: "18:00",
      closesAt: "03:00",
      isClosed: false,
    })),
    skipDuplicates: true,
  });

  await prisma.deliveryZone.upsert({
    where: {
      id: "6a53ebc2-5b9f-4a8a-b2d5-0d08b3df7770",
    },
    update: {
      label: "Centro expandido",
      deliveryFeeCents: 800,
    },
    create: {
      id: "6a53ebc2-5b9f-4a8a-b2d5-0d08b3df7770",
      storeId: store.id,
      label: "Centro expandido",
      mode: DeliveryZoneMode.neighborhood_radius,
      centerLat: -23.55052,
      centerLng: -46.633308,
      radiusMeters: 6000,
      deliveryFeeCents: 800,
      neighborhoodsJson: ["Centro", "Bela Vista", "Liberdade"],
    },
  });

  await prisma.inventoryItem.upsert({
    where: { productId: featuredProduct.id },
    update: {
      storeId: store.id,
      currentStock: 48,
      safetyStock: 6,
    },
    create: {
      storeId: store.id,
      productId: featuredProduct.id,
      currentStock: 48,
      safetyStock: 6,
    },
  });

  const customer = await prisma.customer.upsert({
    where: {
      storeId_phone: {
        storeId: store.id,
        phone: "5511988887777",
      },
    },
    update: {
      name: "Cliente Seed",
      email: "cliente.seed@example.com",
      totalSpentCents: 2290,
      isInactive: false,
    },
    create: {
      storeId: store.id,
      name: "Cliente Seed",
      phone: "5511988887777",
      email: "cliente.seed@example.com",
      totalSpentCents: 2290,
      isInactive: false,
    },
  });

  await prisma.customerAddress.upsert({
    where: { id: "5d350cdd-2ec9-4c82-b314-fb64f4d6c001" },
    update: {
      street: "Rua Exemplo",
      number: "123",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
      postalCode: "01000000",
      isPrimary: true,
    },
    create: {
      id: "5d350cdd-2ec9-4c82-b314-fb64f4d6c001",
      customerId: customer.id,
      street: "Rua Exemplo",
      number: "123",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
      postalCode: "01000000",
      isPrimary: true,
    },
  });

  const order = await prisma.order.upsert({
    where: {
      storeId_publicId: {
        storeId: store.id,
        publicId: "PED-0001",
      },
    },
    update: {
      customerId: customer.id,
      channel: OrderChannel.web,
      status: OrderStatus.pending,
      paymentMethod: PaymentMethod.pix,
      paymentStatus: PaymentStatus.pending,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      deliveryStreet: "Rua Exemplo",
      deliveryNumber: "123",
      deliveryNeighborhood: "Centro",
      deliveryCity: "Sao Paulo",
      deliveryState: "SP",
      deliveryPostalCode: "01000000",
      subtotalCents: 799,
      deliveryFeeCents: 800,
      discountCents: 0,
      totalCents: 1599,
      notes: "Pedido seed do bootstrap",
    },
    create: {
      storeId: store.id,
      customerId: customer.id,
      publicId: "PED-0001",
      channel: OrderChannel.web,
      status: OrderStatus.pending,
      paymentMethod: PaymentMethod.pix,
      paymentStatus: PaymentStatus.pending,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerEmail: customer.email,
      deliveryStreet: "Rua Exemplo",
      deliveryNumber: "123",
      deliveryNeighborhood: "Centro",
      deliveryCity: "Sao Paulo",
      deliveryState: "SP",
      deliveryPostalCode: "01000000",
      subtotalCents: 799,
      deliveryFeeCents: 800,
      discountCents: 0,
      totalCents: 1599,
      notes: "Pedido seed do bootstrap",
    },
  });

  await prisma.orderItem.upsert({
    where: { id: "750925d6-0ce8-4d03-ae14-0e8f913f0001" },
    update: {
      orderId: order.id,
      productId: featuredProduct.id,
      productName: featuredProduct.name,
      quantity: 1,
      unitPriceCents: 799,
      totalPriceCents: 799,
    },
    create: {
      id: "750925d6-0ce8-4d03-ae14-0e8f913f0001",
      orderId: order.id,
      productId: featuredProduct.id,
      productName: featuredProduct.name,
      quantity: 1,
      unitPriceCents: 799,
      totalPriceCents: 799,
    },
  });

  await prisma.orderPayment.upsert({
    where: { id: "c2f64a8c-222e-4b10-aec8-0f01980f0001" },
    update: {
      orderId: order.id,
      method: PaymentMethod.pix,
      status: PaymentStatus.pending,
      provider: "manual",
      amountCents: 1599,
    },
    create: {
      id: "c2f64a8c-222e-4b10-aec8-0f01980f0001",
      orderId: order.id,
      method: PaymentMethod.pix,
      status: PaymentStatus.pending,
      provider: "manual",
      amountCents: 1599,
    },
  });

  await prisma.orderEvent.upsert({
    where: { id: "6f4df21a-9f9f-4b4f-8c50-2d02faea0001" },
    update: {
      orderId: order.id,
      type: "order.created",
      payloadJson: {
        status: OrderStatus.pending,
        source: "seed",
      },
    },
    create: {
      id: "6f4df21a-9f9f-4b4f-8c50-2d02faea0001",
      orderId: order.id,
      type: "order.created",
      payloadJson: {
        status: OrderStatus.pending,
        source: "seed",
      },
    },
  });

  await prisma.inventoryMovement.upsert({
    where: { id: "81a0b236-00ef-4e45-b2c2-e4cb6dfa0001" },
    update: {
      inventoryItemId: (await prisma.inventoryItem.findUniqueOrThrow({ where: { productId: featuredProduct.id } })).id,
      storeId: store.id,
      type: InventoryMovementType.replenishment,
      quantityDelta: 48,
      reason: "seed.initial_stock",
    },
    create: {
      id: "81a0b236-00ef-4e45-b2c2-e4cb6dfa0001",
      inventoryItemId: (await prisma.inventoryItem.findUniqueOrThrow({ where: { productId: featuredProduct.id } })).id,
      storeId: store.id,
      type: InventoryMovementType.replenishment,
      quantityDelta: 48,
      reason: "seed.initial_stock",
    },
  });
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
