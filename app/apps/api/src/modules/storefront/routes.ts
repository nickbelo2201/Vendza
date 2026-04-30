import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { envelopeSchema, ok, notFound } from "../../lib/http.js";
import {
  calcularFrete,
  createOrderReal,
  getBootstrap,
  getCategories,
  getOrderByPublicIdReal,
  getOrdersByPhone,
  getProductBySlugReal,
  getProducts,
  getStorefrontConfig,
  quoteCartReal,
} from "./storefront-service.js";

// ─── Schemas de resposta — storefront ────────────────────────────────────────

/** Schema de hora de funcionamento da loja */
const StoreHourSchema = Type.Object({
  weekday: Type.Integer(),
  opensAt: Type.String(),
  closesAt: Type.String(),
  isClosed: Type.Boolean(),
});

/** Schema de configuração pública da loja */
const StorefrontConfigSchema = Type.Object({
  id: Type.String(),
  branding: Type.Object({
    name: Type.String(),
    slug: Type.String(),
    logoUrl: Type.Union([Type.String(), Type.Null()]),
  }),
  status: Type.String(),
  whatsappPhone: Type.Union([Type.String(), Type.Null()]),
  minimumOrderValueCents: Type.Integer(),
  paymentMethods: Type.Array(Type.String()),
  hours: Type.Array(StoreHourSchema),
  legalNotice: Type.String(),
});

/** Schema de subcategoria */
const SubcategorySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  sortOrder: Type.Integer(),
});

/** Schema de categoria com filhos */
const CategorySchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  sortOrder: Type.Integer(),
  children: Type.Array(SubcategorySchema),
});

/** Schema de categoria resumida (sem filhos) */
const CategoryRefSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
});

/** Schema de fardo público (bundle de produto) */
const BundlePublicoSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  bundlePriceCents: Type.Integer(),
  quantity: Type.Integer(),
  isAvailable: Type.Boolean(),
});

/** Schema de produto público (listagem e detalhe) */
const StorefrontProductSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  listPriceCents: Type.Integer(),
  salePriceCents: Type.Union([Type.Integer(), Type.Null()]),
  isAvailable: Type.Boolean(),
  isFeatured: Type.Boolean(),
  offer: Type.Boolean(),
  category: Type.Union([CategoryRefSchema, Type.Null()]),
  bundles: Type.Array(BundlePublicoSchema),
});

/** Schema de produto com campo categorySlug (retorno de getProductBySlugReal) */
const StorefrontProductDetailSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  imageUrl: Type.Union([Type.String(), Type.Null()]),
  listPriceCents: Type.Integer(),
  salePriceCents: Type.Union([Type.Integer(), Type.Null()]),
  isAvailable: Type.Boolean(),
  isFeatured: Type.Boolean(),
  offer: Type.Boolean(),
  categorySlug: Type.Union([Type.String(), Type.Null()]),
  category: Type.Union([CategoryRefSchema, Type.Null()]),
  bundles: Type.Array(BundlePublicoSchema),
});

/** Schema de paginação */
const PaginationSchema = Type.Object({
  page: Type.Integer(),
  pageSize: Type.Integer(),
  total: Type.Integer(),
  totalPages: Type.Integer(),
});

/** Schema de listagem paginada de produtos */
const ProductsListSchema = Type.Object({
  items: Type.Array(StorefrontProductSchema),
  pagination: PaginationSchema,
});

/** Schema de item cotado no carrinho */
const QuotedItemSchema = Type.Object({
  productId: Type.String(),
  name: Type.String(),
  quantity: Type.Integer(),
  unitPriceCents: Type.Integer(),
  totalPriceCents: Type.Integer(),
});

/** Schema de cotação do carrinho */
const CartQuoteSchema = Type.Object({
  items: Type.Array(QuotedItemSchema),
  subtotalCents: Type.Integer(),
  deliveryFeeCents: Type.Integer(),
  discountCents: Type.Integer(),
  totalCents: Type.Integer(),
  etaMinutes: Type.Union([Type.Integer(), Type.Null()]),
  validUntil: Type.String(),
});

/** Schema de retorno ao criar pedido */
const OrderCreatedSchema = Type.Object({
  publicId: Type.String(),
  totalCents: Type.Integer(),
  status: Type.String(),
});

/** Schema de item do pedido */
const OrderItemSchema = Type.Object({
  id: Type.String(),
  productId: Type.String(),
  productName: Type.String(),
  quantity: Type.Integer(),
  unitPriceCents: Type.Integer(),
  totalPriceCents: Type.Integer(),
});

/** Schema de evento da timeline */
const TimelineEventSchema = Type.Object({
  type: Type.String(),
  label: Type.String(),
  createdAt: Type.String(),
});

/** Schema completo do pedido para rastreamento */
const OrderTrackingSchema = Type.Object({
  id: Type.String(),
  publicId: Type.String(),
  status: Type.String(),
  channel: Type.String(),
  paymentMethod: Type.String(),
  customerName: Type.String(),
  customerPhone: Type.String(),
  subtotalCents: Type.Integer(),
  deliveryFeeCents: Type.Integer(),
  discountCents: Type.Integer(),
  totalCents: Type.Integer(),
  notes: Type.Union([Type.String(), Type.Null()]),
  placedAt: Type.Unsafe<Date | string>({}),
  items: Type.Array(OrderItemSchema),
  events: Type.Array(Type.Object({ id: Type.String(), type: Type.String(), createdAt: Type.Unsafe<Date | string>({}) })),
  timeline: Type.Array(TimelineEventSchema),
});

/** Schema de cliente resumido */
const CustomerRefSchema = Type.Union([
  Type.Object({ id: Type.String(), name: Type.String() }),
  Type.Null(),
]);

/** Schema de item do pedido no histórico do cliente */
const ClienteOrderItemSchema = Type.Object({
  id: Type.String(),
  productId: Type.String(),
  productName: Type.String(),
  quantity: Type.Integer(),
  unitPriceCents: Type.Integer(),
  totalPriceCents: Type.Integer(),
});

/** Schema de evento de timeline no histórico do cliente */
const ClienteTimelineEventSchema = Type.Object({
  type: Type.String(),
  label: Type.String(),
  createdAt: Type.String(),
});

/** Schema de pedido no histórico do cliente */
const ClienteOrderSchema = Type.Object({
  id: Type.String(),
  publicId: Type.String(),
  status: Type.String(),
  statusLabel: Type.String(),
  paymentMethod: Type.String(),
  subtotalCents: Type.Integer(),
  deliveryFeeCents: Type.Integer(),
  totalCents: Type.Integer(),
  placedAt: Type.String(),
  items: Type.Array(ClienteOrderItemSchema),
  events: Type.Array(Type.Object({ id: Type.String(), type: Type.String(), createdAt: Type.Unsafe<Date | string>({}) })),
  timeline: Type.Array(ClienteTimelineEventSchema),
});

/** Schema de pedidos do cliente */
const ClientePedidosSchema = Type.Object({
  customer: CustomerRefSchema,
  orders: Type.Array(ClienteOrderSchema),
  total: Type.Integer(),
  page: Type.Integer(),
  pageSize: Type.Integer(),
  totalPages: Type.Integer(),
});

/** Schema de resultado de cálculo de frete (zona encontrada) */
const FreteZonaSchema = Type.Object({
  zonaId: Type.String(),
  label: Type.String(),
  feeCents: Type.Integer(),
  etaMinutes: Type.Integer(),
  minimumOrderCents: Type.Integer(),
  freeShippingAboveCents: Type.Integer(),
});

/** Schema de resultado de cálculo de frete (fora da área) */
const FreteForaSchema = Type.Object({
  fora: Type.Literal(true),
  motivo: Type.Optional(Type.String()),
});

/** Schema de bootstrap (config + categorias + produtos) */
const BootstrapSchema = Type.Object({
  config: StorefrontConfigSchema,
  categories: Type.Array(CategorySchema),
  products: Type.Array(StorefrontProductSchema),
});

// ─────────────────────────────────────────────────────────────────────────────

const ProductFiltersSchema = Type.Object({
  category: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  featured: Type.Optional(Type.Boolean()),
  offer: Type.Optional(Type.Boolean()),
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 200, default: 50 })),
});

const QuoteBodySchema = Type.Object({
  items: Type.Array(
    Type.Object({
      productId: Type.String(),
      quantity: Type.Integer({ minimum: 1 }),
    }),
    { minItems: 1 },
  ),
  address: Type.Optional(Type.String()),
  coupon: Type.Optional(Type.String()),
});

const CreateOrderBodySchema = Type.Object({
  customer: Type.Object({
    name: Type.String({ minLength: 2 }),
    phone: Type.String({ minLength: 8 }),
    email: Type.Optional(Type.String({ format: "email" })),
  }),
  items: Type.Array(
    Type.Object({
      productId: Type.String(),
      quantity: Type.Integer({ minimum: 1 }),
    }),
    { minItems: 1 },
  ),
  address: Type.Object({
    line1: Type.String(),
    number: Type.Optional(Type.String()),
    complement: Type.Optional(Type.String()),
    neighborhood: Type.String(),
    city: Type.String(),
    state: Type.String(),
    postalCode: Type.Optional(Type.String()),
  }),
  deliveryZoneId: Type.Optional(Type.String()),
  freightCents: Type.Optional(Type.Integer()),
  payment: Type.Object({
    method: Type.Union([
      Type.Literal("pix"),
      Type.Literal("cash"),
      Type.Literal("card_online"),
      Type.Literal("card_on_delivery"),
    ]),
  }),
  note: Type.Optional(Type.String()),
});

type ProductFilters = Static<typeof ProductFiltersSchema>;
// ProductFilters agora inclui page e pageSize para paginação
type QuoteBody = Static<typeof QuoteBodySchema>;
type CreateOrderBody = Static<typeof CreateOrderBodySchema>;

async function resolveStoreId(): Promise<string> {
  const storeSlug = process.env.STORE_SLUG;
  if (!storeSlug) {
    const err = new Error("Loja não configurada. Contate o suporte.");
    Object.assign(err, { statusCode: 503 });
    throw err;
  }
  const config = await getStorefrontConfig(storeSlug);
  if (!config) {
    const err = new Error("Loja não encontrada. Contate o suporte.");
    Object.assign(err, { statusCode: 503 });
    throw err;
  }
  return config.id;
}

export const storefrontRoutes: FastifyPluginAsync = async (app) => {
  app.get("/storefront/config", { schema: { response: { 200: envelopeSchema(StorefrontConfigSchema) } } }, async () => {
    const storeSlug = process.env.STORE_SLUG;
    if (!storeSlug) throw new Error("STORE_SLUG não configurado.");
    const config = await getStorefrontConfig(storeSlug);
    if (!config) throw new Error(`Loja com slug '${storeSlug}' não encontrada.`);
    return ok(config, { stub: false });
  });

  app.get("/storefront/bootstrap", { schema: { response: { 200: envelopeSchema(BootstrapSchema) } } }, async () => {
    const storeSlug = process.env.STORE_SLUG;
    if (!storeSlug) throw new Error("STORE_SLUG não configurado.");
    const bootstrap = await getBootstrap(storeSlug);
    if (!bootstrap) throw new Error(`Loja com slug '${storeSlug}' não encontrada.`);
    return ok(bootstrap, { stub: false });
  });

  app.get("/catalog/categories", { schema: { response: { 200: envelopeSchema(Type.Array(CategorySchema)) } } }, async () => {
    const storeId = await resolveStoreId();
    const categories = await getCategories(storeId);
    return ok(categories, { stub: false });
  });

  app.get<{ Querystring: ProductFilters }>(
    "/catalog/products",
    {
      schema: {
        querystring: ProductFiltersSchema,
        response: { 200: envelopeSchema(ProductsListSchema) },
      },
    },
    async ({ query }) => {
      const storeId = await resolveStoreId();
      const products = await getProducts(storeId, query);
      return ok(products, { stub: false });
    },
  );

  app.get<{ Params: { slug: string } }>(
    "/catalog/products/:slug",
    {
      schema: {
        params: Type.Object({ slug: Type.String() }),
        response: { 200: envelopeSchema(StorefrontProductDetailSchema) },
      },
    },
    async ({ params }, reply) => {
      const storeId = await resolveStoreId();
      const product = await getProductBySlugReal(storeId, params.slug);
      if (!product) {
        return reply.code(404).send(notFound("Produto nao encontrado."));
      }
      return ok(product, { stub: false });
    },
  );

  app.post<{ Body: QuoteBody }>(
    "/cart/quote",
    {
      schema: {
        body: QuoteBodySchema,
        response: { 200: envelopeSchema(CartQuoteSchema) },
      },
    },
    async ({ body }, reply) => {
      const storeId = await resolveStoreId();
      const result = await quoteCartReal(storeId, body.items, body.address);
      if ("error" in result) {
        return reply.code(422).send(ok({ message: "Produto indisponível.", productId: result.productId }, { stub: false }));
      }
      return ok(result, { stub: false });
    },
  );

  app.post<{ Body: CreateOrderBody }>(
    "/orders",
    {
      // Rate limit mais restritivo: criação de pedido é operação sensível
      config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
      schema: {
        body: CreateOrderBodySchema,
        response: { 201: envelopeSchema(OrderCreatedSchema) },
      },
    },
    async ({ body }, reply) => {
      const storeId = await resolveStoreId();
      const result = await createOrderReal(storeId, body);
      reply.code(201);
      return ok(result, { stub: false });
    },
  );

  app.get<{ Params: { publicId: string } }>(
    "/orders/:publicId",
    {
      schema: {
        params: Type.Object({ publicId: Type.String() }),
        response: { 200: envelopeSchema(OrderTrackingSchema) },
      },
    },
    async ({ params }, reply) => {
      const storeId = await resolveStoreId();
      const order = await getOrderByPublicIdReal(storeId, params.publicId);
      if (!order) {
        return reply.code(404).send(notFound("Pedido nao encontrado."));
      }
      return ok(order, { stub: false });
    },
  );

  const ClientePedidosQuerySchema = Type.Object({
    phone: Type.String({ minLength: 8 }),
    page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
    pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 50, default: 10 })),
  });

  type ClientePedidosQuery = Static<typeof ClientePedidosQuerySchema>;

  app.get<{ Querystring: ClientePedidosQuery }>(
    "/storefront/cliente/pedidos",
    {
      // Rate limit restritivo: consulta de pedidos por telefone pode ser abusada para enumeração
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        querystring: ClientePedidosQuerySchema,
        response: { 200: envelopeSchema(ClientePedidosSchema) },
      },
    },
    async ({ query }) => {
      const storeId = await resolveStoreId();
      const result = await getOrdersByPhone(
        storeId,
        query.phone,
        query.page ?? 1,
        query.pageSize ?? 10,
      );
      return ok(result, { stub: false });
    },
  );

  const CalcularFreteBodySchema = Type.Object({
    lat: Type.Optional(Type.Number()),
    lng: Type.Optional(Type.Number()),
    cep: Type.Optional(Type.String()),
    bairro: Type.Optional(Type.String()),
  });

  type CalcularFreteBody = Static<typeof CalcularFreteBodySchema>;

  app.post<{ Body: CalcularFreteBody }>(
    "/storefront/calcular-frete",
    {
      schema: {
        body: CalcularFreteBodySchema,
        response: { 200: envelopeSchema(Type.Union([FreteZonaSchema, FreteForaSchema])) },
      },
    },
    async ({ body }) => {
      const storeId = await resolveStoreId();
      const resultado = await calcularFrete(storeId, body);
      return ok(resultado, { stub: false });
    },
  );
};
