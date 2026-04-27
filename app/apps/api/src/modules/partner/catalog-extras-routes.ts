import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok, notFound, badRequest } from "../../lib/http.js";
import {
  createCombo,
  createComplement,
  createComplementGroup,
  createExtra,
  createProductBundle,
  deleteCombo,
  deleteComplement,
  deleteComplementGroup,
  deleteExtra,
  deleteProductBundle,
  listCombos,
  listComplementGroups,
  listComplements,
  listExtras,
  listProductBundles,
  toggleComboActive,
  toggleComplementAvailable,
  toggleExtraAvailable,
  updateCombo,
  updateComplement,
  updateComplementGroup,
  updateExtra,
  updateProductBundle,
} from "./catalog-extras-service.js";
import { type PartnerContext } from "./context.js";
import { requireRole } from "./require-role.js";

// ─── Schemas TypeBox ──────────────────────────────────────────────────────────

const NullableString = Type.Union([Type.String(), Type.Null()]);

// ─── Combo schemas ────────────────────────────────────────────────────────────

const ComboItemResponseSchema = Type.Object({
  id: Type.String(),
  comboId: Type.String(),
  productId: Type.String(),
  quantity: Type.Integer(),
  productName: Type.String(),
  productSlug: Type.String(),
  productListPriceCents: Type.Integer(),
});

const ComboResponseSchema = Type.Object({
  id: Type.String(),
  storeId: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  description: NullableString,
  imageUrl: NullableString,
  priceCents: Type.Integer(),
  isActive: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  items: Type.Array(ComboItemResponseSchema),
});

const ComboItemInputSchema = Type.Object({
  productId: Type.String({ minLength: 1 }),
  quantity: Type.Integer({ minimum: 1 }),
});

const ComboCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
  description: Type.Optional(NullableString),
  imageUrl: Type.Optional(NullableString),
  priceCents: Type.Integer({ minimum: 0 }),
  isActive: Type.Optional(Type.Boolean()),
  items: Type.Array(ComboItemInputSchema, { minItems: 1 }),
});

const ComboPatchSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  slug: Type.Optional(Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" })),
  description: Type.Optional(NullableString),
  imageUrl: Type.Optional(NullableString),
  priceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  isActive: Type.Optional(Type.Boolean()),
  items: Type.Optional(Type.Array(ComboItemInputSchema, { minItems: 1 })),
});

const ComboActiveSchema = Type.Object({ isActive: Type.Boolean() });

// ─── ComplementGroup schemas ──────────────────────────────────────────────────

const ComplementGroupResponseSchema = Type.Object({
  id: Type.String(),
  storeId: Type.String(),
  name: Type.String(),
  description: NullableString,
  minSelection: Type.Integer(),
  maxSelection: Type.Integer(),
  isRequired: Type.Boolean(),
  isActive: Type.Boolean(),
  complementsCount: Type.Integer(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const ComplementGroupCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(NullableString),
  minSelection: Type.Optional(Type.Integer({ minimum: 0 })),
  maxSelection: Type.Optional(Type.Integer({ minimum: 1 })),
  isRequired: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
});

const ComplementGroupPatchSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(NullableString),
  minSelection: Type.Optional(Type.Integer({ minimum: 0 })),
  maxSelection: Type.Optional(Type.Integer({ minimum: 1 })),
  isRequired: Type.Optional(Type.Boolean()),
  isActive: Type.Optional(Type.Boolean()),
});

// ─── Complement schemas ───────────────────────────────────────────────────────

const ComplementResponseSchema = Type.Object({
  id: Type.String(),
  storeId: Type.String(),
  complementGroupId: Type.String(),
  name: Type.String(),
  description: NullableString,
  imageUrl: NullableString,
  additionalPriceCents: Type.Integer(),
  isAvailable: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const ComplementCreateSchema = Type.Object({
  complementGroupId: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(NullableString),
  imageUrl: Type.Optional(NullableString),
  additionalPriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  isAvailable: Type.Optional(Type.Boolean()),
});

const ComplementPatchSchema = Type.Object({
  complementGroupId: Type.Optional(Type.String({ minLength: 1 })),
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(NullableString),
  imageUrl: Type.Optional(NullableString),
  additionalPriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  isAvailable: Type.Optional(Type.Boolean()),
});

const ComplementsQuerySchema = Type.Object({
  groupId: Type.Optional(Type.String()),
});

const AvailabilitySchema = Type.Object({ isAvailable: Type.Boolean() });

// ─── Extra schemas ────────────────────────────────────────────────────────────

const ExtraResponseSchema = Type.Object({
  id: Type.String(),
  storeId: Type.String(),
  name: Type.String(),
  description: NullableString,
  priceCents: Type.Integer(),
  imageUrl: NullableString,
  isAvailable: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const ExtraCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  description: Type.Optional(NullableString),
  priceCents: Type.Integer({ minimum: 0 }),
  imageUrl: Type.Optional(NullableString),
  isAvailable: Type.Optional(Type.Boolean()),
});

const ExtraPatchSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  description: Type.Optional(NullableString),
  priceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  imageUrl: Type.Optional(NullableString),
  isAvailable: Type.Optional(Type.Boolean()),
});

const DeletedResponseSchema = Type.Object({ deleted: Type.Literal(true) });

// ─── ProductBundle (Fardo) schemas ───────────────────────────────────────────

const ProductBundleResponseSchema = Type.Object({
  id: Type.String(),
  productId: Type.String(),
  productName: Type.Optional(Type.String()),
  name: Type.String(),
  slug: Type.String(),
  bundlePriceCents: Type.Integer(),
  itemsJson: Type.Unknown(),
  isAvailable: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
});

const ProductBundleCreateSchema = Type.Object({
  productId: Type.String({ minLength: 1 }),
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
  bundlePriceCents: Type.Integer({ minimum: 0 }),
  itemsJson: Type.Unknown(),
  isAvailable: Type.Optional(Type.Boolean()),
});

const ProductBundlePatchSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  slug: Type.Optional(Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" })),
  bundlePriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
  itemsJson: Type.Optional(Type.Unknown()),
  isAvailable: Type.Optional(Type.Boolean()),
});

const ProductBundlesQuerySchema = Type.Object({
  productId: Type.Optional(Type.String()),
});

// ─── Tipos derivados ──────────────────────────────────────────────────────────

type ComboCreateBody = Static<typeof ComboCreateSchema>;
type ComboPatchBody = Static<typeof ComboPatchSchema>;
type ComboActiveBody = Static<typeof ComboActiveSchema>;
type ComplementGroupCreateBody = Static<typeof ComplementGroupCreateSchema>;
type ComplementGroupPatchBody = Static<typeof ComplementGroupPatchSchema>;
type ComplementCreateBody = Static<typeof ComplementCreateSchema>;
type ComplementPatchBody = Static<typeof ComplementPatchSchema>;
type ComplementsQuery = Static<typeof ComplementsQuerySchema>;
type AvailabilityBody = Static<typeof AvailabilitySchema>;
type ExtraCreateBody = Static<typeof ExtraCreateSchema>;
type ExtraPatchBody = Static<typeof ExtraPatchSchema>;
type ProductBundleCreateBody = Static<typeof ProductBundleCreateSchema>;
type ProductBundlePatchBody = Static<typeof ProductBundlePatchSchema>;
type ProductBundlesQuery = Static<typeof ProductBundlesQuerySchema>;

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function catalogExtrasRoutes(app: FastifyInstance) {
  // ─── Combos ───────────────────────────────────────────────────────────────

  app.get(
    "/partner/combos",
    { schema: { response: { 200: envelopeSchema(Type.Array(ComboResponseSchema)) } } },
    async (request) => ok(await listCombos(partnerContext(request))),
  );

  app.post<{ Body: ComboCreateBody }>(
    "/partner/combos",
    {
      schema: {
        body: ComboCreateSchema,
        response: { 201: envelopeSchema(ComboResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        reply.code(201);
        return ok(await createCombo(partnerContext(request), request.body));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar combo.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: ComboPatchBody }>(
    "/partner/combos/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: ComboPatchSchema,
        response: { 200: envelopeSchema(ComboResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        const combo = await updateCombo(
          partnerContext(request),
          request.params.id,
          request.body,
        );
        if (!combo) {
          return reply.code(404).send(notFound("Combo não encontrado."));
        }
        return ok(combo);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao atualizar combo.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: ComboActiveBody }>(
    "/partner/combos/:id/active",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: ComboActiveSchema,
        response: { 200: envelopeSchema(ComboResponseSchema) },
      },
    },
    async (request, reply) => {
      const combo = await toggleComboActive(
        partnerContext(request),
        request.params.id,
        request.body.isActive,
      );
      if (!combo) {
        return reply.code(404).send(notFound("Combo não encontrado."));
      }
      return ok(combo);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/combos/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(DeletedResponseSchema) },
      },
    },
    async (request, reply) => {
      const result = await deleteCombo(partnerContext(request), request.params.id);
      if ("error" in result) {
        return reply.code(404).send(notFound(result.error));
      }
      return ok(result);
    },
  );

  // ─── Grupos de complementos ───────────────────────────────────────────────

  app.get(
    "/partner/complement-groups",
    {
      schema: {
        response: { 200: envelopeSchema(Type.Array(ComplementGroupResponseSchema)) },
      },
    },
    async (request) => ok(await listComplementGroups(partnerContext(request))),
  );

  app.post<{ Body: ComplementGroupCreateBody }>(
    "/partner/complement-groups",
    {
      schema: {
        body: ComplementGroupCreateSchema,
        response: { 201: envelopeSchema(ComplementGroupResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        reply.code(201);
        return ok(await createComplementGroup(partnerContext(request), request.body));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao criar grupo de complementos.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: ComplementGroupPatchBody }>(
    "/partner/complement-groups/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: ComplementGroupPatchSchema,
        response: { 200: envelopeSchema(ComplementGroupResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        const group = await updateComplementGroup(
          partnerContext(request),
          request.params.id,
          request.body,
        );
        if (!group) {
          return reply.code(404).send(notFound("Grupo de complementos não encontrado."));
        }
        return ok(group);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar grupo de complementos.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/complement-groups/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(DeletedResponseSchema) },
      },
    },
    async (request, reply) => {
      const result = await deleteComplementGroup(
        partnerContext(request),
        request.params.id,
      );
      if ("error" in result) {
        return reply.code(400).send(badRequest(result.error));
      }
      return ok(result);
    },
  );

  // ─── Complementos ─────────────────────────────────────────────────────────

  app.get<{ Querystring: ComplementsQuery }>(
    "/partner/complements",
    {
      schema: {
        querystring: ComplementsQuerySchema,
        response: { 200: envelopeSchema(Type.Array(ComplementResponseSchema)) },
      },
    },
    async (request) =>
      ok(await listComplements(partnerContext(request), request.query.groupId)),
  );

  app.post<{ Body: ComplementCreateBody }>(
    "/partner/complements",
    {
      schema: {
        body: ComplementCreateSchema,
        response: { 201: envelopeSchema(ComplementResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        reply.code(201);
        return ok(await createComplement(partnerContext(request), request.body));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar complemento.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: ComplementPatchBody }>(
    "/partner/complements/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: ComplementPatchSchema,
        response: { 200: envelopeSchema(ComplementResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        const complement = await updateComplement(
          partnerContext(request),
          request.params.id,
          request.body,
        );
        if (!complement) {
          return reply.code(404).send(notFound("Complemento não encontrado."));
        }
        return ok(complement);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erro ao atualizar complemento.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: AvailabilityBody }>(
    "/partner/complements/:id/availability",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: AvailabilitySchema,
        response: { 200: envelopeSchema(ComplementResponseSchema) },
      },
    },
    async (request, reply) => {
      const complement = await toggleComplementAvailable(
        partnerContext(request),
        request.params.id,
        request.body.isAvailable,
      );
      if (!complement) {
        return reply.code(404).send(notFound("Complemento não encontrado."));
      }
      return ok(complement);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/complements/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(DeletedResponseSchema) },
      },
    },
    async (request, reply) => {
      const result = await deleteComplement(partnerContext(request), request.params.id);
      if ("error" in result) {
        return reply.code(404).send(notFound(result.error));
      }
      return ok(result);
    },
  );

  // ─── Extras ───────────────────────────────────────────────────────────────

  app.get(
    "/partner/extras",
    { schema: { response: { 200: envelopeSchema(Type.Array(ExtraResponseSchema)) } } },
    async (request) => ok(await listExtras(partnerContext(request))),
  );

  app.post<{ Body: ExtraCreateBody }>(
    "/partner/extras",
    {
      schema: {
        body: ExtraCreateSchema,
        response: { 201: envelopeSchema(ExtraResponseSchema) },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return ok(await createExtra(partnerContext(request), request.body));
    },
  );

  app.patch<{ Params: { id: string }; Body: ExtraPatchBody }>(
    "/partner/extras/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: ExtraPatchSchema,
        response: { 200: envelopeSchema(ExtraResponseSchema) },
      },
    },
    async (request, reply) => {
      const extra = await updateExtra(
        partnerContext(request),
        request.params.id,
        request.body,
      );
      if (!extra) {
        return reply.code(404).send(notFound("Extra não encontrado."));
      }
      return ok(extra);
    },
  );

  app.patch<{ Params: { id: string }; Body: AvailabilityBody }>(
    "/partner/extras/:id/availability",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: AvailabilitySchema,
        response: { 200: envelopeSchema(ExtraResponseSchema) },
      },
    },
    async (request, reply) => {
      const extra = await toggleExtraAvailable(
        partnerContext(request),
        request.params.id,
        request.body.isAvailable,
      );
      if (!extra) {
        return reply.code(404).send(notFound("Extra não encontrado."));
      }
      return ok(extra);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/extras/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(DeletedResponseSchema) },
      },
    },
    async (request, reply) => {
      const result = await deleteExtra(partnerContext(request), request.params.id);
      if ("error" in result) {
        return reply.code(404).send(notFound(result.error));
      }
      return ok(result);
    },
  );

  // ─── ProductBundles (Fardos) ──────────────────────────────────────────────

  app.get<{ Querystring: ProductBundlesQuery }>(
    "/partner/product-bundles",
    {
      schema: {
        querystring: ProductBundlesQuerySchema,
        response: { 200: envelopeSchema(Type.Array(ProductBundleResponseSchema)) },
      },
    },
    async (request) =>
      ok(await listProductBundles(partnerContext(request), request.query.productId)),
  );

  app.post<{ Body: ProductBundleCreateBody }>(
    "/partner/product-bundles",
    {
      schema: {
        body: ProductBundleCreateSchema,
        response: { 201: envelopeSchema(ProductBundleResponseSchema) },
      },
    },
    async (request, reply) => {
      try {
        reply.code(201);
        return ok(await createProductBundle(partnerContext(request), request.body));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao criar fardo.";
        return reply.code(400).send(badRequest(message));
      }
    },
  );

  app.patch<{ Params: { id: string }; Body: ProductBundlePatchBody }>(
    "/partner/product-bundles/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: ProductBundlePatchSchema,
        response: { 200: envelopeSchema(ProductBundleResponseSchema) },
      },
    },
    async (request, reply) => {
      const bundle = await updateProductBundle(
        partnerContext(request),
        request.params.id,
        request.body,
      );
      if (!bundle) {
        return reply.code(404).send(notFound("Fardo não encontrado."));
      }
      return ok(bundle);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/product-bundles/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(DeletedResponseSchema) },
      },
    },
    async (request, reply) => {
      const result = await deleteProductBundle(partnerContext(request), request.params.id);
      if ("error" in result) {
        return reply.code(404).send(notFound(result.error));
      }
      return ok(result);
    },
  );
}
