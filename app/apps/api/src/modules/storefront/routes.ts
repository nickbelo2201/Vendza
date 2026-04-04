import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import {
  createOrderReal,
  getCategories,
  getOrderByPublicIdReal,
  getProductBySlugReal,
  getProducts,
  getStorefrontConfig,
  quoteCartReal,
} from "./storefront-service.js";

const ProductFiltersSchema = Type.Object({
  category: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  featured: Type.Optional(Type.Boolean()),
  offer: Type.Optional(Type.Boolean()),
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
    neighborhood: Type.String(),
    city: Type.String(),
    state: Type.String(),
  }),
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
type QuoteBody = Static<typeof QuoteBodySchema>;
type CreateOrderBody = Static<typeof CreateOrderBodySchema>;

async function resolveStoreId(): Promise<string> {
  const storeSlug = process.env.STORE_SLUG;
  if (!storeSlug) throw new Error("STORE_SLUG não configurado.");
  const config = await getStorefrontConfig(storeSlug);
  if (!config) throw new Error(`Loja com slug '${storeSlug}' não encontrada.`);
  return config.id;
}

export const storefrontRoutes: FastifyPluginAsync = async (app) => {
  app.get("/storefront/config", { schema: { response: { 200: envelopeSchema(Type.Any()) } } }, async () => {
    const storeSlug = process.env.STORE_SLUG;
    if (!storeSlug) throw new Error("STORE_SLUG não configurado.");
    const config = await getStorefrontConfig(storeSlug);
    if (!config) throw new Error(`Loja com slug '${storeSlug}' não encontrada.`);
    return ok(config, { stub: false });
  });

  app.get("/catalog/categories", { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } }, async () => {
    const storeId = await resolveStoreId();
    const categories = await getCategories(storeId);
    return ok(categories, { stub: false });
  });

  app.get<{ Querystring: ProductFilters }>(
    "/catalog/products",
    {
      schema: {
        querystring: ProductFiltersSchema,
        response: { 200: envelopeSchema(Type.Array(Type.Any())) },
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
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async ({ params }, reply) => {
      const storeId = await resolveStoreId();
      const product = await getProductBySlugReal(storeId, params.slug);
      if (!product) {
        return reply.code(404).send(ok({ message: "Produto nao encontrado." }, { stub: false }));
      }
      return ok(product, { stub: false });
    },
  );

  app.post<{ Body: QuoteBody }>(
    "/cart/quote",
    {
      schema: {
        body: QuoteBodySchema,
        response: { 200: envelopeSchema(Type.Any()) },
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
      schema: {
        body: CreateOrderBodySchema,
        response: { 201: envelopeSchema(Type.Any()) },
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
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async ({ params }, reply) => {
      const storeId = await resolveStoreId();
      const order = await getOrderByPublicIdReal(storeId, params.publicId);
      if (!order) {
        return reply.code(404).send(ok({ message: "Pedido nao encontrado." }, { stub: false }));
      }
      return ok(order, { stub: false });
    },
  );
};
