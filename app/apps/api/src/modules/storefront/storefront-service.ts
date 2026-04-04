import { prisma } from "@vendza/database";

import { getOrderPlacedQueue } from "../../jobs/queues.js";
import { getIO } from "../../plugins/socketio.js";

export async function getStorefrontConfig(storeSlug: string) {
  const store = await prisma.store.findFirst({
    where: { slug: storeSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      whatsappPhone: true,
      status: true,
      minimumOrderValueCents: true,
      hours: {
        select: {
          weekday: true,
          opensAt: true,
          closesAt: true,
          isClosed: true,
        },
        orderBy: { weekday: "asc" },
      },
    },
  });

  if (!store) {
    return null;
  }

  return {
    id: store.id,
    branding: {
      name: store.name,
      slug: store.slug,
      logoUrl: store.logoUrl,
    },
    status: store.status,
    whatsappPhone: store.whatsappPhone,
    minimumOrderValueCents: store.minimumOrderValueCents,
    paymentMethods: ["pix", "cash", "card_online", "card_on_delivery"],
    hours: store.hours,
    legalNotice: "Venda exclusiva para maiores de 18 anos.",
  };
}

export async function getCategories(storeId: string) {
  return prisma.category.findMany({
    where: { storeId, isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sortOrder: true,
    },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getProducts(
  storeId: string,
  filters?: {
    category?: string;
    search?: string;
    featured?: boolean;
    offer?: boolean;
  },
) {
  const products = await prisma.product.findMany({
    where: {
      storeId,
      isAvailable: true,
      ...(filters?.featured ? { isFeatured: true } : {}),
      ...(filters?.offer ? { salePriceCents: { not: null } } : {}),
      ...(filters?.category
        ? { category: { OR: [{ id: filters.category }, { slug: filters.category }] } }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { description: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      listPriceCents: true,
      salePriceCents: true,
      isAvailable: true,
      isFeatured: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
  });

  type ProductRow = (typeof products)[number];
  return products.map((p: ProductRow) => ({
    ...p,
    offer: p.salePriceCents !== null && p.salePriceCents < p.listPriceCents,
  }));
}

export async function quoteCartReal(
  storeId: string,
  items: Array<{ productId: string; quantity: number }>,
  neighborhood?: string,
) {
  const productIds = items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { storeId, id: { in: productIds } },
    select: {
      id: true,
      name: true,
      listPriceCents: true,
      salePriceCents: true,
      isAvailable: true,
    },
  });

  type DbProduct = (typeof dbProducts)[number];

  const unavailable = items.find((item) => {
    const p = dbProducts.find((dp: DbProduct) => dp.id === item.productId);
    return !p || !p.isAvailable;
  });

  if (unavailable) {
    return {
      error: "produto_indisponivel",
      productId: unavailable.productId,
    } as const;
  }

  const quotedItems = items.map((item) => {
    const p = dbProducts.find((dp: DbProduct) => dp.id === item.productId)!;
    const unitPriceCents = p.salePriceCents ?? p.listPriceCents;
    return {
      productId: item.productId,
      name: p.name,
      quantity: item.quantity,
      unitPriceCents,
      totalPriceCents: unitPriceCents * item.quantity,
    };
  });

  const subtotalCents = quotedItems.reduce((sum, i) => sum + i.totalPriceCents, 0);

  // Buscar zona de entrega pelo bairro (se fornecido)
  let deliveryFeeCents = 0;
  let etaMinutes: number | null = null;

  if (neighborhood) {
    const zone = await prisma.deliveryZone.findFirst({
      where: {
        storeId,
        isActive: true,
        neighborhoodsJson: { path: [], array_contains: neighborhood },
      },
      select: { deliveryFeeCents: true, estimatedDeliveryMinutes: true },
    });

    if (zone) {
      deliveryFeeCents = zone.deliveryFeeCents;
      etaMinutes = zone.estimatedDeliveryMinutes;
    } else {
      // fallback: primeira zona ativa
      const defaultZone = await prisma.deliveryZone.findFirst({
        where: { storeId, isActive: true },
        select: { deliveryFeeCents: true, estimatedDeliveryMinutes: true },
        orderBy: { deliveryFeeCents: "asc" },
      });
      if (defaultZone) {
        deliveryFeeCents = defaultZone.deliveryFeeCents;
        etaMinutes = defaultZone.estimatedDeliveryMinutes;
      }
    }
  } else {
    const defaultZone = await prisma.deliveryZone.findFirst({
      where: { storeId, isActive: true },
      select: { deliveryFeeCents: true, estimatedDeliveryMinutes: true },
      orderBy: { deliveryFeeCents: "asc" },
    });
    if (defaultZone) {
      deliveryFeeCents = defaultZone.deliveryFeeCents;
      etaMinutes = defaultZone.estimatedDeliveryMinutes;
    }
  }

  return {
    items: quotedItems,
    subtotalCents,
    deliveryFeeCents,
    discountCents: 0,
    totalCents: subtotalCents + deliveryFeeCents,
    etaMinutes,
    validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

export async function createOrderReal(
  storeId: string,
  input: {
    customer: { name: string; phone: string; email?: string };
    items: Array<{ productId: string; quantity: number }>;
    address: { line1: string; number?: string; neighborhood: string; city: string; state: string };
    payment: { method: "pix" | "cash" | "card_online" | "card_on_delivery" };
    note?: string;
  },
) {
  // Buscar preços reais
  const productIds = input.items.map((i) => i.productId);
  const dbProducts = await prisma.product.findMany({
    where: { storeId, id: { in: productIds } },
    select: { id: true, name: true, listPriceCents: true, salePriceCents: true, isAvailable: true },
  });

  type DbProduct = (typeof dbProducts)[number];

  const unavailable = input.items.find((item) => {
    const p = dbProducts.find((dp: DbProduct) => dp.id === item.productId);
    return !p || !p.isAvailable;
  });
  if (unavailable) throw new Error(`Produto indisponível: ${unavailable.productId}`);

  const quotedItems = input.items.map((item) => {
    const p = dbProducts.find((dp: DbProduct) => dp.id === item.productId)!;
    const unitPriceCents = p.salePriceCents ?? p.listPriceCents;
    return { productId: item.productId, productName: p.name, quantity: item.quantity, unitPriceCents, totalPriceCents: unitPriceCents * item.quantity };
  });

  const subtotalCents = quotedItems.reduce((sum, i) => sum + i.totalPriceCents, 0);

  // Buscar frete
  let deliveryFeeCents = 0;
  const zone = await prisma.deliveryZone.findFirst({
    where: { storeId, isActive: true },
    select: { deliveryFeeCents: true },
    orderBy: { deliveryFeeCents: "asc" },
  });
  if (zone) deliveryFeeCents = zone.deliveryFeeCents;

  const totalCents = subtotalCents + deliveryFeeCents;

  // Upsert customer por phone+storeId
  const customer = await prisma.customer.upsert({
    where: { storeId_phone: { storeId, phone: input.customer.phone } },
    create: { storeId, name: input.customer.name, phone: input.customer.phone, email: input.customer.email },
    update: { name: input.customer.name, email: input.customer.email },
    select: { id: true },
  });

  // Gerar publicId sequencial
  const count = await prisma.order.count({ where: { storeId } });
  const publicId = `PED-${String(count + 1).padStart(4, "0")}`;

  // Método de pagamento mapeado
  const paymentMethodMap: Record<string, "pix" | "cash" | "card_on_delivery" | "card_online"> = {
    pix: "pix",
    cash: "cash",
    card_online: "card_online",
    card_on_delivery: "card_on_delivery",
  };
  const paymentMethod = paymentMethodMap[input.payment.method] ?? "pix";

  // Criar order com items e evento
  const order = await prisma.order.create({
    data: {
      storeId,
      customerId: customer.id,
      publicId,
      channel: "web",
      status: "pending",
      paymentMethod,
      paymentStatus: "pending",
      customerName: input.customer.name,
      customerPhone: input.customer.phone,
      customerEmail: input.customer.email,
      deliveryStreet: input.address.line1,
      deliveryNumber: input.address.number ?? "",
      deliveryNeighborhood: input.address.neighborhood,
      deliveryCity: input.address.city,
      deliveryState: input.address.state,
      deliveryPostalCode: "",
      subtotalCents,
      deliveryFeeCents,
      discountCents: 0,
      totalCents,
      notes: input.note,
      items: {
        create: quotedItems.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          quantity: i.quantity,
          unitPriceCents: i.unitPriceCents,
          totalPriceCents: i.totalPriceCents,
        })),
      },
      events: {
        create: [{ type: "placed", payloadJson: { note: "Pedido recebido via web" } }],
      },
    },
    select: { id: true, publicId: true, status: true, totalCents: true },
  });

  // Emitir evento realtime para o painel parceiro
  try {
    getIO().to(`store:${storeId}`).emit("order:created", {
      publicId: order.publicId,
      customerName: input.customer.name,
      totalCents: order.totalCents,
      status: order.status,
    });
  } catch {
    // Socket.io pode não estar inicializado em testes
  }

  // Enfileirar job BullMQ para processamento assíncrono (ex: WhatsApp)
  try {
    await getOrderPlacedQueue()?.add("order.placed", {
      publicId: order.publicId,
      customerName: input.customer.name,
      totalCents: order.totalCents,
      storeId,
    });
  } catch {
    // Redis indisponível — job ignorado, pedido já foi criado com sucesso
  }

  return { publicId: order.publicId, totalCents: order.totalCents, status: order.status };
}

const EVENT_LABELS: Record<string, string> = {
  placed: "Pedido recebido",
  confirmed: "Pedido confirmado",
  preparing: "Em preparo",
  ready_for_delivery: "Pronto para entrega",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  cancelled: "Pedido cancelado",
};

export async function getOrderByPublicIdReal(storeId: string, publicId: string) {
  const order = await prisma.order.findFirst({
    where: { storeId, publicId },
    select: {
      id: true,
      publicId: true,
      status: true,
      channel: true,
      paymentMethod: true,
      customerName: true,
      customerPhone: true,
      subtotalCents: true,
      deliveryFeeCents: true,
      discountCents: true,
      totalCents: true,
      notes: true,
      placedAt: true,
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          quantity: true,
          unitPriceCents: true,
          totalPriceCents: true,
        },
      },
      events: {
        select: { id: true, type: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!order) return null;

  type OrderEvent = (typeof order.events)[number];

  return {
    ...order,
    timeline: order.events.map((event: OrderEvent) => ({
      type: event.type,
      label: EVENT_LABELS[event.type] ?? event.type,
      createdAt: event.createdAt.toISOString(),
    })),
  };
}

export async function getProductBySlugReal(storeId: string, slug: string) {
  const product = await prisma.product.findFirst({
    where: { storeId, slug, isAvailable: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      imageUrl: true,
      listPriceCents: true,
      salePriceCents: true,
      isAvailable: true,
      isFeatured: true,
      category: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!product) return null;

  return {
    ...product,
    categorySlug: product.category?.slug ?? null,
    offer: product.salePriceCents !== null && product.salePriceCents < product.listPriceCents,
  };
}
