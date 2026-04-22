import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { prisma } from "@vendza/database";
import { envelopeSchema, ok, notFound, badRequest } from "../../lib/http.js";
import {
  createPartnerCategory,
  createPartnerProduct,
  deletePartnerCategory,
  deletePartnerProduct,
  findProductByBarcode,
  listPartnerCategories,
  listPartnerProducts,
  updatePartnerCategory,
  updatePartnerProduct,
  updateProductAvailability,
  type ListProductsFilters,
} from "./catalog-service.js";
import { type PartnerContext } from "./context.js";
import { importarProdutos, type ImportProductInput } from "./import-service.js";
import { requireRole } from "./require-role.js";

// ─── Schemas TypeBox ──────────────────────────────────────────────────────────

const ProductUpsertSchema = Type.Object({
  name: Type.String(),
  slug: Type.String(),
  categoryId: Type.Optional(Type.String()),
  listPriceCents: Type.Integer({ minimum: 0 }),
  salePriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  imageUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isAvailable: Type.Optional(Type.Boolean()),
  isFeatured: Type.Optional(Type.Boolean()),
  barcode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const AvailabilitySchema = Type.Object({
  isAvailable: Type.Boolean(),
});

const CategoryCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
  isActive: Type.Optional(Type.Boolean()),
  parentCategoryId: Type.Optional(Type.String()),
});

const CategoryPatchSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  slug: Type.Optional(Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" })),
  isActive: Type.Optional(Type.Boolean()),
});

const ProductFiltersSchema = Type.Object({
  busca: Type.Optional(Type.String()),
  categoriaId: Type.Optional(Type.String()),
  subcategoriaId: Type.Optional(Type.String()),
  pagina: Type.Optional(Type.Integer({ minimum: 1 })),
  limite: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000 })),
});

const ImportProductSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  listPriceCents: Type.Integer({ minimum: 1 }),
  salePriceCents: Type.Optional(Type.Union([Type.Integer({ minimum: 0 }), Type.Null()])),
  categoryName: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  isAvailable: Type.Optional(Type.Boolean()),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const ImportBodySchema = Type.Object({
  products: Type.Array(ImportProductSchema, { minItems: 1, maxItems: 1000 }),
});

type ProductUpsertBody = Static<typeof ProductUpsertSchema>;
type AvailabilityBody = Static<typeof AvailabilitySchema>;
type CategoryCreateBody = Static<typeof CategoryCreateSchema>;
type CategoryPatchBody = Static<typeof CategoryPatchSchema>;

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function catalogRoutes(app: FastifyInstance) {
  // ─── Categorias ───────────────────────────────────────────────────────────

  app.get(
    "/partner/categories",
    { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } },
    async (request) => ok(await listPartnerCategories(partnerContext(request))),
  );

  app.post<{ Body: CategoryCreateBody }>(
    "/partner/categories",
    {
      schema: {
        body: CategoryCreateSchema,
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      try {
        reply.code(201);
        return ok(await createPartnerCategory(partnerContext(request), request.body));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar categoria.";
        return reply.code(400).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "INVALID_PARENT_CATEGORY", message },
        });
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: CategoryPatchBody }>(
    "/partner/categories/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: CategoryPatchSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const category = await updatePartnerCategory(partnerContext(request), request.params.id, request.body);
      if (!category) {
        return reply.code(404).send(notFound("Categoria nao encontrada."));
      }
      return ok(category);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/categories/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const result = await deletePartnerCategory(partnerContext(request), request.params.id);
      if ("error" in result) {
        return reply.code(400).send(badRequest(result.error));
      }
      return ok(result);
    },
  );

  // ─── Produtos ─────────────────────────────────────────────────────────────

  app.get<{ Querystring: ListProductsFilters }>(
    "/partner/products",
    {
      schema: {
        querystring: ProductFiltersSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request) => ok(await listPartnerProducts(partnerContext(request), request.query)),
  );

  app.get(
    "/partner/products/barcode/:barcode",
    {
      schema: {
        params: Type.Object({ barcode: Type.String({ minLength: 1 }) }),
      },
    },
    async (request, reply) => {
      const ctx = partnerContext(request);
      const { barcode } = request.params as { barcode: string };
      const product = await findProductByBarcode(ctx, barcode);
      if (!product) {
        return reply.code(404).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "PRODUCT_NOT_FOUND", message: "Produto não encontrado." },
        });
      }
      return ok(product);
    },
  );

  app.post<{ Body: ProductUpsertBody }>(
    "/partner/products",
    {
      schema: {
        body: ProductUpsertSchema,
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return ok(await createPartnerProduct(partnerContext(request), request.body));
    },
  );

  app.patch<{ Params: { id: string }; Body: Partial<ProductUpsertBody> }>(
    "/partner/products/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Partial(ProductUpsertSchema),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const product = await updatePartnerProduct(partnerContext(request), request.params.id, request.body);
      if (!product) {
        return reply.code(404).send(notFound("Produto nao encontrado."));
      }
      return ok(product);
    },
  );

  app.patch<{ Params: { id: string }; Body: AvailabilityBody }>(
    "/partner/products/:id/availability",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: AvailabilitySchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const product = await updateProductAvailability(
        partnerContext(request),
        request.params.id,
        request.body.isAvailable,
      );
      if (!product) {
        return reply.code(404).send(notFound("Produto nao encontrado."));
      }
      return ok(product);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/products/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const product = await deletePartnerProduct(partnerContext(request), request.params.id);
      if (!product) {
        return reply.code(404).send(notFound("Produto nao encontrado."));
      }
      return ok(product);
    },
  );

  // ─── Importação de produtos em lote ───────────────────────────────────────

  app.post(
    "/partner/products/import",
    {
      // Rate limit muito restritivo: importação em lote pode criar centenas de produtos por chamada
      config: { rateLimit: { max: 3, timeWindow: "1 minute" } },
      schema: {
        body: ImportBodySchema,
        response: {
          200: envelopeSchema(Type.Object({
            imported: Type.Integer(),
            errors: Type.Array(Type.Object({
              line: Type.Integer(),
              message: Type.String(),
            })),
          })),
        },
      },
    },
    async (request, reply) => {
      const ctx = partnerContext(request);
      const { products } = request.body as Static<typeof ImportBodySchema>;
      const result = await importarProdutos(ctx, products as ImportProductInput[]);
      return ok(result);
    },
  );

  // ─── Upload de imagem (signed URL) ────────────────────────────────────────

  app.post<{ Body: { ext: string; productId?: string } }>(
    "/partner/upload/signed-url",
    {
      schema: {
        body: Type.Object({
          ext: Type.String(),
          productId: Type.Optional(Type.String()),
        }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const { ext, productId } = request.body;

      // C-08: Validar ext contra allowlist
      const EXT_ALLOWLIST = ["jpg", "jpeg", "png", "webp", "gif"];
      const extNormalizada = ext.replace(/^\./, "").toLowerCase();
      if (!EXT_ALLOWLIST.includes(extNormalizada)) {
        return reply.code(400).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "INVALID_EXT", message: `Extensão não permitida. Use: ${EXT_ALLOWLIST.join(", ")}.` },
        });
      }

      // C-08: Validar que productId pertence ao storeId do contexto
      if (productId) {
        const ctx = partnerContext(request);
        const produto = await prisma.product.findFirst({
          where: { id: productId, storeId: ctx.storeId },
          select: { id: true },
        });
        if (!produto) {
          return reply.code(403).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: { code: "PRODUCT_NOT_FOUND", message: "Produto não encontrado ou não pertence a esta loja." },
          });
        }
      }

      const identificador = productId ?? `temp_${Date.now()}`;
      const path = `${identificador}.${extNormalizada}`;

      const { data, error } = await app.supabaseAdmin.storage
        .from("product-images")
        .createSignedUploadUrl(path, { upsert: true });

      if (error || !data) {
        return reply.code(500).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "UPLOAD_ERROR", message: error?.message ?? "Erro ao gerar URL de upload." },
        });
      }

      const { data: { publicUrl } } = app.supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(path);

      return ok({ signedUrl: data.signedUrl, token: data.token, path, publicUrl });
    },
  );
}
