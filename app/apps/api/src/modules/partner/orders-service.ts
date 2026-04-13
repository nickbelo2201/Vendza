import { prisma, type Prisma, type PrismaClient } from "@vendza/database";

import { getOrderStatusChangedQueue } from "../../jobs/queues.js";
import { getIO } from "../../plugins/socketio.js";
import type { PartnerContext } from "./context.js";

export type PartnerOrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

export type PartnerOrderFilters = {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type PartnerOrderItem = {
  productId: string;
  title: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

export type PartnerOrderAddress = {
  line1: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type PartnerOrderTimelineEvent = {
  type: string;
  label: string;
  createdAt: string;
  note?: string;
};

export type PartnerOrderRecord = {
  id: string;
  publicId: string;
  status: PartnerOrderStatus;
  channel: "web" | "whatsapp" | "manual" | "balcao";
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: "pix" | "cash" | "card_online" | "card_on_delivery";
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: string;
  note: string | null;
  address: PartnerOrderAddress;
  items: PartnerOrderItem[];
  timeline: PartnerOrderTimelineEvent[];
};

export type PartnerOrderCreationResult = PartnerOrderRecord & {
  trackingUrl: string;
};

export type PartnerManualOrderInput = {
  customer: {
    name: string;
    phone?: string | null;
    email?: string;
  };
  items: Array<{
    productId: string;
    quantity: number;
  }>;
  address?: {
    line1: string;
    number?: string;
    neighborhood: string;
    city: string;
    state: string;
  } | null;
  deliveryType?: "balcao" | "delivery";
  payment: {
    method: PartnerOrderRecord["paymentMethod"];
  };
  note?: string;
};

const DEFAULT_POSTAL_CODE = "00000-000";

function buildTrackingUrl(publicId: string) {
  return `/pedidos/${publicId}`;
}

function normalizeNote(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function buildTimelineLabel(type: string, payload: Record<string, unknown>) {
  if (type === "order.created") {
    return "Pedido criado";
  }

  if (type === "order.status_changed" && typeof payload.status === "string") {
    return `Status alterado para ${payload.status}`;
  }

  return type;
}

function toPartnerOrderRecord(order: {
  id: string;
  publicId: string;
  status: string;
  channel: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: Date;
  notes: string | null;
  deliveryStreet: string;
  deliveryNumber: string;
  deliveryNeighborhood: string;
  deliveryCity: string;
  deliveryState: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
  }>;
  events: Array<{
    type: string;
    payloadJson: unknown;
    createdAt: Date;
  }>;
}): PartnerOrderRecord {
  return {
    id: order.id,
    publicId: order.publicId,
    status: order.status as PartnerOrderStatus,
    channel: order.channel as PartnerOrderRecord["channel"],
    customerId: order.customerId,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    paymentMethod: order.paymentMethod as PartnerOrderRecord["paymentMethod"],
    subtotalCents: order.subtotalCents,
    deliveryFeeCents: order.deliveryFeeCents,
    discountCents: order.discountCents,
    totalCents: order.totalCents,
    placedAt: order.placedAt.toISOString(),
    note: order.notes,
    address: {
      line1: order.deliveryStreet,
      number: order.deliveryNumber || undefined,
      neighborhood: order.deliveryNeighborhood,
      city: order.deliveryCity,
      state: order.deliveryState,
    },
    items: order.items.map((item) => ({
      productId: item.productId,
      title: item.productName,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalPriceCents,
    })),
    timeline: order.events
      .slice()
      .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
      .map((event) => {
        const payload =
          event.payloadJson && typeof event.payloadJson === "object" && !Array.isArray(event.payloadJson)
            ? (event.payloadJson as Record<string, unknown>)
            : {};

        const label = typeof payload.label === "string" ? payload.label : buildTimelineLabel(event.type, payload);
        const note = normalizeNote(payload.note);

        return {
          type: event.type,
          label,
          createdAt: event.createdAt.toISOString(),
          ...(note ? { note } : {}),
        };
      }),
  };
}

async function resolveCustomerAddressSeed(
  client: Pick<PrismaClient, "customerAddress">,
  customerId: string,
  address: PartnerOrderAddress,
) {
  const existingAddressCount = await client.customerAddress.count({
    where: { customerId },
  });

  if (existingAddressCount > 0) {
    return;
  }

  await client.customerAddress.create({
    data: {
      customerId,
      label: "Principal",
      recipientName: address.line1,
      phone: "",
      street: address.line1,
      number: address.number ?? "S/N",
      complement: null,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      postalCode: DEFAULT_POSTAL_CODE,
      latitude: null,
      longitude: null,
      isPrimary: true,
    },
  });
}

async function findStoreOrder(storeId: string, id: string) {
  return prisma.order.findFirst({
    where: {
      storeId,
      OR: [{ id }, { publicId: id }],
    },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function listPartnerOrders(context: PartnerContext, filters: PartnerOrderFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 50));
  const skip = (page - 1) * pageSize;

  const where = {
    storeId: context.storeId,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.search
      ? {
          OR: [
            { publicId: { contains: filters.search, mode: "insensitive" as const } },
            { customerName: { contains: filters.search, mode: "insensitive" as const } },
            { customerPhone: { contains: filters.search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [orders, total] = await prisma.$transaction([
    prisma.order.findMany({
      where,
      orderBy: { placedAt: "desc" },
      take: pageSize,
      skip,
      include: {
        items: { orderBy: { createdAt: "asc" } },
        events: { orderBy: { createdAt: "asc" } },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map(toPartnerOrderRecord),
    total,
    page,
    pageSize,
  };
}

export async function getPartnerOrderById(context: PartnerContext, id: string) {
  const order = await findStoreOrder(context.storeId, id);
  return order ? toPartnerOrderRecord(order) : null;
}

export async function updatePartnerOrderStatus(
  context: PartnerContext,
  id: string,
  input: {
    status: PartnerOrderStatus;
    note?: string;
  },
) {
  const existingOrder = await findStoreOrder(context.storeId, id);

  if (!existingOrder) {
    return null;
  }

  const now = new Date();
  const updatedOrder = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.order.update({
      where: {
        id: existingOrder.id,
      },
      data: {
        status: input.status,
        confirmedAt:
          input.status === "confirmed" && !existingOrder.confirmedAt ? now : existingOrder.confirmedAt,
        deliveredAt: input.status === "delivered" ? now : existingOrder.deliveredAt,
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    await tx.orderEvent.create({
      data: {
        orderId: existingOrder.id,
        type: "order.status_changed",
        payloadJson: {
          status: input.status,
          note: input.note ?? null,
          previousStatus: existingOrder.status,
          label: `Status alterado para ${input.status}`,
        },
        createdByUserId: context.storeUserId,
      },
    });

    return tx.order.findUniqueOrThrow({
      where: { id: existingOrder.id },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  });

  const record = toPartnerOrderRecord(updatedOrder);

  // Emitir evento realtime
  try {
    const io = getIO();
    const updatedAt = new Date().toISOString();
    io.to(`store:${context.storeId}`).emit("order:status_changed", {
      publicId: record.publicId,
      status: input.status,
      updatedAt,
    });
    io.to(`order:${record.publicId}`).emit("order:status_changed", {
      status: input.status,
      updatedAt,
    });
  } catch {
    // Socket.io pode não estar inicializado em testes
  }

  // Enfileirar job BullMQ para processamento assíncrono (ex: WhatsApp)
  try {
    await getOrderStatusChangedQueue()?.add("order.status_changed", {
      publicId: record.publicId,
      status: input.status,
      storeId: context.storeId,
    });
  } catch {
    // Redis indisponível — job ignorado
  }

  return record;
}

export type ExportOrderFilters = {
  from?: string;
  to?: string;
  status?: string;
};

function escapeCsvField(value: string): string {
  // Proteção contra CSV/formula injection — caracteres que Excel interpreta como fórmulas
  const FORMULA_PREFIXES = ["=", "+", "-", "@", "\t", "\r"];
  let sanitized = value;

  if (FORMULA_PREFIXES.some((prefix) => sanitized.startsWith(prefix))) {
    sanitized = `'${sanitized}`;
  }

  if (sanitized.includes(",") || sanitized.includes('"') || sanitized.includes("\n") || sanitized !== value) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

function formatCentsToCurrency(cents: number): string {
  return (cents / 100).toFixed(2);
}

export async function exportPartnerOrdersCSV(context: PartnerContext, filters: ExportOrderFilters) {
  const where: Record<string, unknown> = {
    storeId: context.storeId,
  };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.from || filters.to) {
    const placedAt: { gte?: Date; lte?: Date } = {};
    if (filters.from) placedAt.gte = new Date(filters.from);
    if (filters.to) placedAt.lte = new Date(filters.to);
    where.placedAt = placedAt;
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { placedAt: "desc" },
    take: 50000,
    include: {
      items: true,
    },
  });

  const header = "publicId,data,cliente,telefone,itens,subtotal,frete,total,pagamento,status";

  const rows = orders.map((order: {
    publicId: string;
    placedAt: Date;
    customerName: string;
    customerPhone: string;
    subtotalCents: number;
    deliveryFeeCents: number;
    totalCents: number;
    paymentMethod: string;
    status: string;
    items: Array<{ productName: string; quantity: number }>;
  }) => {
    const itensResumo = order.items
      .map((item: { productName: string; quantity: number }) => `${item.productName} x${item.quantity}`)
      .join("; ");

    return [
      escapeCsvField(order.publicId),
      escapeCsvField(order.placedAt.toISOString()),
      escapeCsvField(order.customerName),
      escapeCsvField(order.customerPhone),
      escapeCsvField(itensResumo),
      formatCentsToCurrency(order.subtotalCents),
      formatCentsToCurrency(order.deliveryFeeCents),
      formatCentsToCurrency(order.totalCents),
      escapeCsvField(order.paymentMethod),
      escapeCsvField(order.status),
    ].join(",");
  });

  return [header, ...rows].join("\n");
}

export async function createManualPartnerOrder(context: PartnerContext, input: PartnerManualOrderInput) {
  const store = await prisma.store.findUnique({
    where: {
      id: context.storeId,
    },
    include: {
      deliveryZones: {
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const products: Array<{
    id: string;
    name: string;
    salePriceCents: number | null;
    listPriceCents: number;
  }> = await prisma.product.findMany({
    where: {
      storeId: context.storeId,
      id: {
        in: input.items.map((item) => item.productId),
      },
    },
    select: {
      id: true,
      name: true,
      salePriceCents: true,
      listPriceCents: true,
    },
  });

  if (!store) {
    throw new Error("Store not found for partner context.");
  }

  const productById = new Map(products.map((product) => [product.id, product]));
  const lineItems = input.items.map((item) => {
    const product = productById.get(item.productId);
    if (!product) {
      throw new Error(`Produto nao encontrado para o parceiro: ${item.productId}`);
    }

    const unitPriceCents = product.salePriceCents ?? product.listPriceCents;
    return {
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPriceCents,
      totalPriceCents: unitPriceCents * item.quantity,
    };
  });

  const subtotalCents = lineItems.reduce((sum, item) => sum + item.totalPriceCents, 0);
  const deliveryFeeCents =
    subtotalCents >= store.minimumOrderValueCents ? store.deliveryZones[0]?.deliveryFeeCents ?? 0 : 0;
  const discountCents = 0;
  const totalCents = subtotalCents + deliveryFeeCents - discountCents;
  const createdAt = new Date();
  const note = input.note ?? null;

  const order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // C-09: Lock por storeId para evitar race condition no publicId sequencial
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${context.storeId}::text))`;
    const orderCount = await tx.order.count({ where: { storeId: context.storeId } });
    const publicId = `PED-${String(orderCount + 1).padStart(4, "0")}`;

    // Cliente anônimo: gera telefone único para satisfazer a unique constraint
    const customerPhone = input.customer.phone ?? `ANON-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const customer = await tx.customer.upsert({
      where: {
        storeId_phone: {
          storeId: context.storeId,
          phone: customerPhone,
        },
      },
      update: {
        name: input.customer.phone ? input.customer.name : undefined,
        email: input.customer.email ?? undefined,
        lastOrderAt: createdAt,
        totalSpentCents: {
          increment: totalCents,
        },
      },
      create: {
        storeId: context.storeId,
        name: input.customer.name,
        phone: customerPhone,
        email: input.customer.email ?? null,
        lastOrderAt: createdAt,
        totalSpentCents: totalCents,
      },
    });

    if (input.address) {
      await resolveCustomerAddressSeed(tx, customer.id, input.address);
    }

    const createdOrder = await tx.order.create({
      data: {
        storeId: context.storeId,
        customerId: customer.id,
        publicId,
        channel: input.deliveryType === "balcao" ? "balcao" : "manual",
        status: "pending",
        paymentMethod: input.payment.method,
        customerName: input.customer.name,
        customerPhone: input.customer.phone ?? "",
        customerEmail: input.customer.email ?? null,
        deliveryStreet: input.address?.line1 ?? "",
        deliveryNumber: input.address?.number ?? "S/N",
        deliveryComplement: null,
        deliveryNeighborhood: input.address?.neighborhood ?? "",
        deliveryCity: input.address?.city ?? "",
        deliveryState: input.address?.state ?? "",
        deliveryPostalCode: DEFAULT_POSTAL_CODE,
        deliveryLat: null,
        deliveryLng: null,
        subtotalCents,
        deliveryFeeCents,
        discountCents,
        totalCents,
        notes: note,
        items: {
          create: lineItems.map((item) => ({
            productId: item.productId,
            variantId: null,
            productName: item.productName,
            variantName: null,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            totalPriceCents: item.totalPriceCents,
            notes: null,
          })),
        },
        events: {
          create: {
            type: "order.created",
            payloadJson: {
              label: "Pedido criado",
              note,
              source: "partner.manual",
            },
            createdByUserId: context.storeUserId,
          },
        },
      },
      include: {
        items: {
          orderBy: { createdAt: "asc" },
        },
        events: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return createdOrder;
  });

  return {
    ...toPartnerOrderRecord(order),
    trackingUrl: buildTrackingUrl(order.publicId),
  };
}
