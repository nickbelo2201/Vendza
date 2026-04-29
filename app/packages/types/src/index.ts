// ─────────────────────────────────────────────────────────────────────────────
// @vendza/types — Tipos canônicos compartilhados
// Todos os tipos de domínio devem ser definidos aqui e importados pelos apps.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Enums como const arrays (compatíveis com TypeBox e Prisma) ───────────────

export const orderStatuses = [
  "pending",
  "confirmed",
  "preparing",
  "ready_for_delivery",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export const paymentMethods = [
  "pix",
  "cash",
  "card_on_delivery",
  "card_online",
] as const;

export const orderChannels = ["web", "whatsapp", "manual", "balcao"] as const;

export const paymentStatuses = [
  "pending",
  "authorized",
  "paid",
  "failed",
  "refunded",
] as const;

// ─── Tipos primitivos derivados dos const arrays ──────────────────────────────

export type OrderStatus = (typeof orderStatuses)[number];
export type PaymentMethod = (typeof paymentMethods)[number];
export type OrderChannel = (typeof orderChannels)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];

// ─── Envelope de resposta da API ──────────────────────────────────────────────

/**
 * Envelope padrão de toda resposta da API Vendza.
 * @template T Tipo do campo `data`.
 */
export interface ApiEnvelope<T> {
  data: T;
  meta: {
    requestedAt: string;
    stub?: boolean;
  };
  error: null | string;
}

/**
 * Resposta paginada genérica.
 * @template T Tipo de cada item da lista.
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ─── Categoria ────────────────────────────────────────────────────────────────

/** Categoria filho (sem filhos aninhados). */
export interface CategoriaFilha {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
}

/** Categoria completa, opcionalmente com filhos. */
export interface Categoria {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string | null;
  isActive?: boolean;
  sortOrder?: number;
  children?: CategoriaFilha[];
}

// ─── Produto ──────────────────────────────────────────────────────────────────

/**
 * Produto retornado nas listagens do painel parceiro.
 * Inclui campos desnormalizados de categoria para exibição.
 */
export interface Produto {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  barcode?: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  parentCategorySlug: string | null;
}

/** Fardo/bundle público retornado pelo storefront. */
export interface BundlePublico {
  id: string;
  name: string;
  bundlePriceCents: number;
  quantity: number;
  isAvailable: boolean;
}

/**
 * Produto retornado pelo storefront público.
 * Inclui campo `offer` calculado pela API e `bundles` de fardo.
 */
export interface ProdutoStorefront {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
  isFeatured: boolean;
  offer: boolean;
  categorySlug: string | null;
  category: { id: string; name: string; slug: string } | null;
  bundles?: BundlePublico[];
}

/** Produto resumido para uso no PDV e modal de pedido manual. */
export interface ProdutoResumo {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  isAvailable: boolean;
  categoryId: string | null;
  barcode?: string | null;
}

/** Resposta paginada de produtos do painel parceiro. */
export interface ProdutosResponse {
  produtos: Produto[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

// ─── Produto para formulário (criação/edição) ─────────────────────────────────

export interface ProdutoForm {
  id?: string;
  name: string;
  slug: string;
  categoryId: string;
  parentCategoryId?: string | null;
  listPriceCents: number;
  salePriceCents: number | null;
  imageUrl: string;
  isAvailable: boolean;
  isFeatured: boolean;
  barcode?: string | null;
}

// ─── Produto em promoção / alertas ────────────────────────────────────────────

export interface ProdutoEmPromocao {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number;
  descontoPercent: number;
  currentStock: number;
}

export interface ProdutoAlerta {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number | null;
  currentStock: number;
  safetyStock?: number;
}

export interface PromocoesResultado {
  emPromocao: ProdutoEmPromocao[];
  alertasParado: ProdutoAlerta[];
  alertasEstoqueAlto: ProdutoAlerta[];
}

// ─── Cliente ──────────────────────────────────────────────────────────────────

/** Cliente do CRM. */
export interface Cliente {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  totalSpentCents: number;
  isInactive: boolean;
  lastOrderAt: string | null;
}

// ─── Pedido ───────────────────────────────────────────────────────────────────

/** Item de pedido em listagens resumidas. */
export interface OrderItemResumo {
  productId: string;
  title: string;
  quantity: number;
  totalCents: number;
}

/** Item de pedido completo (com preço unitário). */
export interface OrderItem {
  id?: string;
  productId: string;
  productName?: string;
  title?: string;
  quantity: number;
  unitPriceCents: number;
  /** Total do item (denominação padrão). */
  totalPriceCents: number;
  /** Alias legado de `totalPriceCents`. */
  totalCents?: number;
  variantName?: string | null;
}

/** Evento de linha do tempo de um pedido. */
export interface TimelineEvent {
  type: string;
  label: string;
  createdAt: string;
  note?: string;
}

/** Endereço de entrega. */
export interface EnderecoEntrega {
  line1: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
}

/** Pedido em listagens resumidas (para tabela/kanban). */
export interface Order {
  id: string;
  publicId: string;
  status: string;
  channel: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  totalCents: number;
  placedAt: string;
  deliveredAt: string | null;
  items: OrderItemResumo[];
}

/** Pedido detalhado (para drawer, comanda e tracking). */
export interface OrderDetalhe {
  id: string;
  publicId: string;
  status: string;
  channel: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
  placedAt: string;
  note: string | null;
  address: EnderecoEntrega | null;
  isPickup?: boolean;
  items: OrderItem[];
  timeline: TimelineEvent[];
}

/** Resposta da listagem de pedidos do painel parceiro. */
export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

// ─── Comanda de pedido (impressão) ───────────────────────────────────────────

export interface OrderComanda {
  id: string;
  publicId: string;
  status: string;
  channel: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  subtotalCents?: number;
  deliveryFeeCents?: number;
  discountCents?: number;
  totalCents: number;
  placedAt: string;
  note?: string | null;
  notes?: string | null;
  /** Alias legado de `address`. */
  deliveryAddress?: EnderecoEntrega | null;
  address?: EnderecoEntrega | null;
  isPickup?: boolean;
  items: OrderItem[];
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/** Resumo de métricas do dashboard principal. */
export interface DashboardSummary {
  ordersToday: number;
  revenueCents: number;
  averageTicketCents: number;
  recurringCustomers: number;
  newCustomers: number;
}

// ─── Estoque ──────────────────────────────────────────────────────────────────

/** Item de inventário retornado pelo painel. */
export interface InventoryItem {
  id: string;
  productId: string;
  currentStock: number;
  safetyStock: number;
  product: { name: string };
}

// ─── Storefront ──────────────────────────────────────────────────────────────

/** Configuração pública da loja para o storefront. */
export interface StorefrontConfig {
  id: string;
  branding: {
    name: string;
    slug: string;
    logoUrl: string | null;
  };
  status: string;
  minimumOrderValueCents: number;
  whatsappPhone?: string;
}

/** Categoria simplificada para o storefront. */
export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
}

// ─── Tipos legados preservados para compatibilidade ──────────────────────────

export interface MoneyBreakdown {
  subtotalCents: number;
  deliveryFeeCents: number;
  discountCents: number;
  totalCents: number;
}

/** Cartão de produto para o storefront (listagem simplificada). */
export interface ProductCard {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  priceCents: number;
  isAvailable: boolean;
  isFeatured: boolean;
}

export interface OrderTrackingSummary extends MoneyBreakdown {
  publicId: string;
  status: OrderStatus;
  placedAt: string;
}

// ─── Combo ───────────────────────────────────────────────────────────────────

export interface ComboItem {
  id: string;
  comboId: string;
  productId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  productListPriceCents: number;
}

export interface Combo {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: ComboItem[];
}

// ─── Grupos de Complementos ──────────────────────────────────────────────────

export interface GrupoDeComplementos {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  minSelection: number;
  maxSelection: number;
  isRequired: boolean;
  isActive: boolean;
  complementsCount: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Complemento ─────────────────────────────────────────────────────────────

export interface Complemento {
  id: string;
  storeId: string;
  complementGroupId: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  additionalPriceCents: number;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Extra ───────────────────────────────────────────────────────────────────

export interface Extra {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  priceCents: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── ProductBundle (Fardo) ───────────────────────────────────────────────────

export interface ProductBundle {
  id: string;
  productId: string;
  productName?: string;
  name: string;
  slug: string;
  bundlePriceCents: number;
  itemsJson: unknown;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}
