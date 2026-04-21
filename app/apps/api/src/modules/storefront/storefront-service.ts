import { prisma, type Prisma } from "@vendza/database";

import { getOrderPlacedQueue } from "../../jobs/queues.js";
import { getIO } from "../../plugins/socketio.js";
import { getRedis } from "../../plugins/redis.js";

// Helper de cache Redis com fallback gracioso
async function withCache<T>(key: string, ttlSeconds: number, fn: () => Promise<T>): Promise<T> {
  const redis = getRedis();
  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached !== null) return JSON.parse(cached) as T;
    } catch { /* Redis indisponível — continua sem cache */ }
  }
  const result = await fn();
  if (redis && result !== null) {
    try {
      await redis.set(key, JSON.stringify(result), "EX", ttlSeconds);
    } catch { /* falha silenciosa */ }
  }
  return result;
}

// Derivar lock key bigint estável a partir do storeId (UUID)
function storeIdToLockKey(storeId: string): bigint {
  const hex = storeId.replace(/-/g, "").substring(0, 15);
  return BigInt("0x" + hex);
}

export async function getStorefrontConfig(storeSlug: string) {
  return withCache(`sf:config:${storeSlug}`, 300, () => _getStorefrontConfig(storeSlug));
}

async function _getStorefrontConfig(storeSlug: string) {
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

export function getCategories(storeId: string) {
  return withCache(`sf:cat:${storeId}`, 60, () =>
    prisma.category.findMany({
      where: { storeId, isActive: true, parentCategoryId: null },
      select: {
        id: true,
        name: true,
        slug: true,
        sortOrder: true,
        children: {
          where: { isActive: true },
          select: { id: true, name: true, slug: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  );
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
  // Queries com filtros dinâmicos (search/category) não são cacheadas
  const hasFilter = filters && (filters.search || filters.category || filters.featured || filters.offer);
  if (hasFilter) return _getProducts(storeId, filters);
  return withCache(`sf:prod:${storeId}`, 60, () => _getProducts(storeId, filters));
}

async function _getProducts(
  storeId: string,
  filters?: { category?: string; search?: string; featured?: boolean; offer?: boolean },
) {
  // Resolver filtro de categoria: se for categoria pai, incluir filhas
  let categoryFilter: Record<string, unknown> = {};
  if (filters?.category) {
    const category = await prisma.category.findFirst({
      where: {
        storeId,
        OR: [{ id: filters.category }, { slug: filters.category }],
      },
    });
    if (category) {
      const categoryIds = [category.id];
      // Se for categoria raiz, adicionar todas as filhas
      if (!category.parentCategoryId) {
        const children = await prisma.category.findMany({
          where: { storeId, parentCategoryId: category.id },
          select: { id: true },
        });
        categoryIds.push(...children.map((c: { id: string }) => c.id));
      }
      categoryFilter = { categoryId: { in: categoryIds } };
    }
  }

  const products = await prisma.product.findMany({
    where: {
      storeId,
      isAvailable: true,
      ...(filters?.featured ? { isFeatured: true } : {}),
      ...(filters?.offer ? { salePriceCents: { not: null } } : {}),
      ...categoryFilter,
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
  if (unavailable) {
    const err = new Error("Produto não disponível. Atualize o carrinho e tente novamente.");
    Object.assign(err, { statusCode: 422 });
    throw err;
  }

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

  const paymentMethodMap: Record<string, "pix" | "cash" | "card_on_delivery" | "card_online"> = {
    pix: "pix",
    cash: "cash",
    card_online: "card_online",
    card_on_delivery: "card_on_delivery",
  };
  const paymentMethod = paymentMethodMap[input.payment.method] ?? "pix";

  // Advisory lock por loja + upsert customer + publicId sequencial + criação do pedido
  // tudo em uma única transação para garantir atomicidade e evitar race condition no publicId
  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // pg_advisory_xact_lock serializa escritas concorrentes para a mesma loja
    const lockKey = storeIdToLockKey(storeId);
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(${lockKey})`;

    const customer = await tx.customer.upsert({
      where: { storeId_phone: { storeId, phone: input.customer.phone } },
      create: { storeId, name: input.customer.name, phone: input.customer.phone, email: input.customer.email },
      update: { name: input.customer.name, email: input.customer.email },
      select: { id: true },
    });

    const count = await tx.order.count({ where: { storeId } });
    const publicId = `PED-${String(count + 1).padStart(4, "0")}`;

    return tx.order.create({
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

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function calcularFrete(
  storeId: string,
  input: { lat?: number; lng?: number; cep?: string; bairro?: string },
): Promise<
  | { zonaId: string; label: string; feeCents: number; etaMinutes: number; minimumOrderCents: number; freeShippingAboveCents: number }
  | { fora: true; motivo?: string }
> {
  // Resolver bairro via ViaCEP se CEP fornecido
  let bairroResolvido = input.bairro?.trim() ?? "";

  if (input.cep) {
    const cepLimpo = input.cep.replace(/\D/g, "");
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      if (!resp.ok) return { fora: true, motivo: "CEP não encontrado" };
      const json = (await resp.json()) as { erro?: boolean; bairro?: string };
      if (json.erro) return { fora: true, motivo: "CEP não encontrado" };
      bairroResolvido = (json.bairro ?? "").trim();
    } catch {
      return { fora: true, motivo: "CEP não encontrado" };
    }
  }

  const zonas = await prisma.deliveryZone.findMany({
    where: { storeId, isActive: true },
  });

  for (const zona of zonas) {
    if (zona.mode === "radius") {
      // Verificar por raio Haversine
      if (
        input.lat != null &&
        input.lng != null &&
        zona.centerLat != null &&
        zona.centerLng != null &&
        zona.radiusMeters != null
      ) {
        const distKm = haversineKm(input.lat, input.lng, zona.centerLat, zona.centerLng);
        if (distKm <= zona.radiusMeters / 1000) {
          return {
            zonaId: zona.id,
            label: zona.label,
            feeCents: zona.deliveryFeeCents,
            etaMinutes: zona.estimatedDeliveryMinutes,
            minimumOrderCents: zona.minimumOrderValueCents,
            freeShippingAboveCents: zona.freeShippingAboveCents,
          };
        }
      }
    } else if (zona.mode === "neighborhoods") {
      // Verificar por bairro (case-insensitive)
      const lista = Array.isArray(zona.neighborhoodsJson)
        ? (zona.neighborhoodsJson as string[])
        : [];
      const bairroNorm = bairroResolvido.toLowerCase();
      const encontrou = lista.some((b) => b.trim().toLowerCase() === bairroNorm);
      if (encontrou) {
        return {
          zonaId: zona.id,
          label: zona.label,
          feeCents: zona.deliveryFeeCents,
          etaMinutes: zona.estimatedDeliveryMinutes,
          minimumOrderCents: zona.minimumOrderValueCents,
          freeShippingAboveCents: zona.freeShippingAboveCents,
        };
      }
    }
  }

  return { fora: true };
}

export async function getOrdersByPhone(
  storeId: string,
  phone: string,
  page: number,
  pageSize: number,
) {
  const customer = await prisma.customer.findUnique({
    where: { storeId_phone: { storeId, phone } },
    select: { id: true, name: true },
  });

  if (!customer) return { customer: null, orders: [], total: 0 };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { storeId, customerId: customer.id },
      select: {
        id: true,
        publicId: true,
        status: true,
        paymentMethod: true,
        subtotalCents: true,
        deliveryFeeCents: true,
        totalCents: true,
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
      orderBy: { placedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where: { storeId, customerId: customer.id } }),
  ]);

  const STATUS_PT: Record<string, string> = {
    pending: "Recebido",
    confirmed: "Confirmado",
    preparing: "Em preparo",
    ready_for_delivery: "Pronto para entrega",
    out_for_delivery: "Saiu para entrega",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const EVENT_LABELS: Record<string, string> = {
    placed: "Pedido recebido",
    confirmed: "Pedido confirmado",
    preparing: "Em preparo",
    ready_for_delivery: "Pronto para entrega",
    out_for_delivery: "Saiu para entrega",
    delivered: "Entregue",
    cancelled: "Pedido cancelado",
  };

  type OrderRow = (typeof orders)[number];
  type OrderEventRow = OrderRow["events"][number];

  return {
    customer: { id: customer.id, name: customer.name },
    orders: orders.map((o: OrderRow) => ({
      ...o,
      statusLabel: STATUS_PT[o.status] ?? o.status,
      placedAt: o.placedAt.toISOString(),
      timeline: o.events.map((e: OrderEventRow) => ({
        type: e.type,
        label: EVENT_LABELS[e.type] ?? e.type,
        createdAt: e.createdAt.toISOString(),
      })),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
