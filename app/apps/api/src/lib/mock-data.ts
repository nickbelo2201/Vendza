type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_delivery"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

type PaymentMethod = "pix" | "cash" | "card_online" | "card_on_delivery";

type QuoteItemInput = {
  productId: string;
  quantity: number;
};

type DeliveryZone = {
  id: string;
  label: string;
  feeCents: number;
  etaMinutes: string;
  neighborhoods: string[];
  radiusKm: number;
};

type OrderTimelineEvent = {
  type: string;
  label: string;
  createdAt: string;
  note?: string;
};

type OrderRecord = {
  id: string;
  publicId: string;
  status: OrderStatus;
  channel: "web" | "manual" | "whatsapp";
  customerId: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: string;
  note: string | null;
  address: {
    line1: string;
    number?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
  items: Array<{
    productId: string;
    title: string;
    quantity: number;
    unitPriceCents: number;
    totalCents: number;
  }>;
  timeline: OrderTimelineEvent[];
};

const categories = [
  { id: "cat-produtos", name: "Produtos", slug: "produtos", isFeatured: true },
  { id: "cat-destilados", name: "Destilados", slug: "destilados", isFeatured: true },
  { id: "cat-snacks", name: "Snacks", slug: "snacks", isFeatured: false },
];

const products = [
  {
    id: "prod-heineken-600",
    categoryId: "cat-produtos",
    categorySlug: "produtos",
    name: "Heineken 600ml",
    slug: "heineken-600ml",
    description: "Produto seed para validar catalogo, quote e pedido.",
    imageUrl: null,
    listPriceCents: 1690,
    salePriceCents: 1490,
    isAvailable: true,
    isFeatured: true,
    offer: true,
  },
  {
    id: "prod-smirnoff-998",
    categoryId: "cat-destilados",
    categorySlug: "destilados",
    name: "Smirnoff 998ml",
    slug: "smirnoff-998ml",
    description: "Vodka seed para o MVP.",
    imageUrl: null,
    listPriceCents: 4990,
    salePriceCents: 4590,
    isAvailable: true,
    isFeatured: false,
    offer: true,
  },
  {
    id: "prod-amendoim",
    categoryId: "cat-snacks",
    categorySlug: "snacks",
    name: "Amendoim Torrado",
    slug: "amendoim-torrado",
    description: "Upsell simples para aumentar ticket medio.",
    imageUrl: null,
    listPriceCents: 890,
    salePriceCents: 890,
    isAvailable: true,
    isFeatured: false,
    offer: false,
  },
];

const customers = [
  {
    id: "cus-seed",
    name: "Cliente Seed",
    phone: "5511988887777",
    email: "cliente.seed@example.com",
    totalSpentCents: 2290,
    isInactive: false,
    lastOrderAt: new Date().toISOString(),
  },
];

const storeSettings = {
  id: "store-vendza",
  slug: "vendza",
  name: "Vendza Piloto",
  whatsappPhone: "5511999999999",
  status: "open",
  timezone: "America/Sao_Paulo",
  minimumOrderValueCents: 3000,
  paymentMethods: ["pix", "cash", "card_online", "card_on_delivery"],
  designGate: true,
};

const deliveryZones: DeliveryZone[] = [
  {
    id: "zone-centro",
    label: "Centro expandido",
    feeCents: 800,
    etaMinutes: "20-40",
    neighborhoods: ["Centro", "Bela Vista", "Liberdade"],
    radiusKm: 6,
  },
];

const primaryZone = deliveryZones[0]!;
const defaultCategoryId = categories[0]!.id;

const inventory = [
  { id: "inv-heineken", productId: "prod-heineken-600", currentStock: 48, lowStockThreshold: 6 },
  { id: "inv-smirnoff", productId: "prod-smirnoff-998", currentStock: 12, lowStockThreshold: 4 },
];

let orderCounter = 2;

const orders: OrderRecord[] = [
  {
    id: "ord-seed-1",
    publicId: "PED-0001",
    status: "pending" as OrderStatus,
    channel: "web",
    customerId: "cus-seed",
    customerName: "Cliente Seed",
    customerPhone: "5511988887777",
    paymentMethod: "pix" as PaymentMethod,
    subtotalCents: 1490,
    deliveryFeeCents: 800,
    discountCents: 0,
    totalCents: 2290,
    placedAt: new Date().toISOString(),
    note: "Pedido seed do bootstrap",
    address: {
      line1: "Rua Exemplo",
      number: "123",
      neighborhood: "Centro",
      city: "Sao Paulo",
      state: "SP",
    },
    items: [
      {
        productId: "prod-heineken-600",
        title: "Heineken 600ml",
        quantity: 1,
        unitPriceCents: 1490,
        totalCents: 1490,
      },
    ],
    timeline: [
      {
        type: "order.created",
        label: "Pedido criado",
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

function getUnitPrice(productId: string) {
  const product = products.find((candidate) => candidate.id === productId);

  if (!product) {
    return null;
  }

  return product.salePriceCents ?? product.listPriceCents;
}

export function getStorefrontConfig() {
  return {
    branding: {
      name: storeSettings.name,
      slug: storeSettings.slug,
      logoUrl: null,
      themeStatus: "design-gate-pending",
    },
    hours: "18:00 - 03:00",
    banners: [],
    paymentMethods: storeSettings.paymentMethods,
    legalNotice: "Venda exclusiva para maiores de 18 anos.",
    designGate: storeSettings.designGate,
  };
}

export function getStoreSettings() {
  return storeSettings;
}

export function getCategories() {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    highlight: category.isFeatured,
  }));
}

export function getProducts(filters?: { category?: string; search?: string; featured?: boolean; offer?: boolean }) {
  return products.filter((product) => {
    if (filters?.category && product.categoryId !== filters.category && product.categorySlug !== filters.category) {
      return false;
    }

    if (filters?.search) {
      const haystack = `${product.name} ${product.description ?? ""}`.toLowerCase();
      if (!haystack.includes(filters.search.toLowerCase())) {
        return false;
      }
    }

    if (filters?.featured && !product.isFeatured) {
      return false;
    }

    if (filters?.offer && !product.offer) {
      return false;
    }

    return true;
  });
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug) ?? null;
}

export function validateCoverage(input: { address: string; neighborhood?: string }) {
  const normalized = `${input.address} ${input.neighborhood ?? ""}`.toLowerCase();
  const eligible = primaryZone.neighborhoods.some((neighborhood) =>
    normalized.includes(neighborhood.toLowerCase()),
  );

  if (!eligible) {
    return {
      eligible: false,
      reason: "Endereco fora da area piloto configurada para o V1.",
      deliveryFeeCents: null,
      etaMinutes: null,
    };
  }

  return {
    eligible: true,
    reason: null,
    deliveryFeeCents: primaryZone.feeCents,
    etaMinutes: primaryZone.etaMinutes,
  };
}

export function quoteCart(items: QuoteItemInput[]) {
  const normalizedItems = items
    .map((item) => {
      const product = products.find((candidate) => candidate.id === item.productId);
      const unitPriceCents = getUnitPrice(item.productId);

      if (!product || unitPriceCents === null) {
        return null;
      }

      return {
        productId: item.productId,
        title: product.name,
        quantity: item.quantity,
        unitPriceCents,
        totalCents: unitPriceCents * item.quantity,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.totalCents, 0);
  const deliveryFeeCents = subtotalCents >= storeSettings.minimumOrderValueCents ? primaryZone.feeCents : 0;

  return {
    items: normalizedItems,
    subtotalCents,
    deliveryFeeCents,
    discountCents: 0,
    totalCents: subtotalCents + deliveryFeeCents,
    validUntil: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

export function createOrder(input: {
  customer: { name: string; phone: string; email?: string };
  items: QuoteItemInput[];
  address: { line1: string; number?: string; neighborhood: string; city: string; state: string };
  payment: { method: PaymentMethod };
  note?: string;
  channel?: "web" | "manual" | "whatsapp";
}) {
  const quote = quoteCart(input.items);
  const publicId = `PED-${String(orderCounter).padStart(4, "0")}`;
  const createdAt = new Date().toISOString();

  orderCounter += 1;

  const order = {
    id: `ord-${publicId.toLowerCase()}`,
    publicId,
    status: "pending" as OrderStatus,
    channel: input.channel ?? "web",
    customerId: "cus-seed",
    customerName: input.customer.name,
    customerPhone: input.customer.phone,
    paymentMethod: input.payment.method,
    subtotalCents: quote.subtotalCents,
    deliveryFeeCents: quote.deliveryFeeCents,
    discountCents: quote.discountCents,
    totalCents: quote.totalCents,
    placedAt: createdAt,
    note: input.note ?? null,
    address: input.address,
    items: quote.items,
    timeline: [
      {
        type: "order.created",
        label: "Pedido criado",
        createdAt,
      },
    ],
  };

  orders.unshift(order);

  return {
    ...order,
    trackingUrl: `/pedidos/${order.publicId}`,
  };
}

export function getOrderByPublicId(publicId: string) {
  return orders.find((order) => order.publicId === publicId) ?? null;
}

export function getDashboardSummary() {
  const revenueCents = orders.reduce((sum, order) => sum + order.totalCents, 0);

  return {
    ordersToday: orders.length,
    revenueCents,
    averageTicketCents: Math.round(revenueCents / Math.max(orders.length, 1)),
    recurringCustomers: 1,
    newCustomers: 0,
  };
}

export function listPartnerOrders(filters?: { status?: string; search?: string }) {
  return orders.filter((order) => {
    if (filters?.status && order.status !== filters.status) {
      return false;
    }
    if (filters?.search) {
      const haystack = `${order.publicId} ${order.customerName} ${order.customerPhone}`.toLowerCase();
      return haystack.includes(filters.search.toLowerCase());
    }
    return true;
  });
}

export function updateOrderStatus(id: string, status: OrderStatus, note?: string) {
  const order = orders.find((candidate) => candidate.id === id || candidate.publicId === id);
  if (!order) {
    return null;
  }
  order.status = status;
  order.timeline.unshift({
    type: "order.status_changed",
    label: `Status alterado para ${status}`,
    createdAt: new Date().toISOString(),
    note,
  });
  return order;
}

export function listPartnerProducts() {
  return products;
}

export function createPartnerProduct(input: {
  name: string;
  slug: string;
  categoryId?: string;
  listPriceCents: number;
  salePriceCents?: number;
}) {
  const category = categories.find((candidate) => candidate.id === input.categoryId) ?? categories[0]!;

  const product = {
    id: `prod-${input.slug}`,
    categoryId: category.id,
    categorySlug: category.slug,
    name: input.name,
    slug: input.slug,
    description: "",
    imageUrl: null,
    listPriceCents: input.listPriceCents,
    salePriceCents: input.salePriceCents ?? input.listPriceCents,
    isAvailable: true,
    isFeatured: false,
    offer: Boolean(input.salePriceCents && input.salePriceCents < input.listPriceCents),
  };

  products.unshift(product);
  return product;
}

export function updatePartnerProduct(
  id: string,
  payload: Partial<{ name: string; description: string; salePriceCents: number; listPriceCents: number }>,
) {
  const product = products.find((candidate) => candidate.id === id || candidate.slug === id);
  if (!product) {
    return null;
  }
  Object.assign(product, payload);
  return product;
}

export function updateProductAvailability(id: string, isAvailable: boolean) {
  const product = products.find((candidate) => candidate.id === id || candidate.slug === id);
  if (!product) {
    return null;
  }
  product.isAvailable = isAvailable;
  return product;
}

export function getInventory() {
  return inventory.map((item) => ({
    ...item,
    product: products.find((product) => product.id === item.productId) ?? null,
  }));
}

export function createInventoryMovement(input: { productId: string; quantityDelta: number; reason: string }) {
  const inventoryItem = inventory.find((item) => item.productId === input.productId);
  if (!inventoryItem) {
    return null;
  }
  inventoryItem.currentStock += input.quantityDelta;
  return {
    id: `mov-${Date.now()}`,
    ...input,
    currentStock: inventoryItem.currentStock,
    createdAt: new Date().toISOString(),
  };
}

export function listCustomers() {
  return customers;
}

export function getCustomerById(id: string) {
  return customers.find((customer) => customer.id === id) ?? null;
}

export function updateCustomer(id: string, payload: Partial<{ name: string; isInactive: boolean }>) {
  const customer = customers.find((candidate) => candidate.id === id);
  if (!customer) {
    return null;
  }
  Object.assign(customer, payload);
  return customer;
}

export function updateStoreSettings(payload: Partial<typeof storeSettings>) {
  Object.assign(storeSettings, payload);
  return storeSettings;
}

export function getStoreHours() {
  return [
    { dayOfWeek: 0, opensAt: "18:00", closesAt: "03:00", isClosed: false },
    { dayOfWeek: 1, opensAt: "18:00", closesAt: "03:00", isClosed: false },
    { dayOfWeek: 2, opensAt: "18:00", closesAt: "03:00", isClosed: false },
    { dayOfWeek: 3, opensAt: "18:00", closesAt: "03:00", isClosed: false },
    { dayOfWeek: 4, opensAt: "18:00", closesAt: "04:00", isClosed: false },
    { dayOfWeek: 5, opensAt: "18:00", closesAt: "04:00", isClosed: false },
    { dayOfWeek: 6, opensAt: "14:00", closesAt: "01:00", isClosed: false },
  ];
}

export function getDeliveryZones() {
  return deliveryZones;
}

export function updateDeliveryZones(
  payload: DeliveryZone[],
) {
  deliveryZones.splice(0, deliveryZones.length, ...payload);
  return deliveryZones;
}
