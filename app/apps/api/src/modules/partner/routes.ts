import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import {
  createInventoryMovement,
  createPartnerCategory,
  createPartnerProduct,
  deletePartnerCategory,
  deletePartnerProduct,
  getInventory,
  listPartnerCategories,
  listPartnerProducts,
  updatePartnerCategory,
  updatePartnerProduct,
  updateProductAvailability,
} from "./catalog-service.js";
import { type PartnerContext } from "./context.js";
import {
  addCustomerNote,
  addCustomerTag,
  getCustomerById,
  getDashboardSummary,
  getPartnerReports,
  listCustomerNotes,
  listCustomerTags,
  listCustomers,
  removeCustomerTag,
  updateCustomer,
} from "./crm-dashboard-service.js";
import {
  createManualPartnerOrder,
  exportPartnerOrdersCSV,
  getPartnerOrderById,
  listPartnerOrders,
  updatePartnerOrderStatus,
} from "./orders-service.js";
import {
  convidarUsuario,
  getContaBancaria,
  getLoja,
  listUsuarios,
  revogarUsuario,
  updateLoja,
  upsertContaBancaria,
} from "./configuracoes-service.js";
import {
  getEstoque,
  getHistoricoEstoque,
  registrarMovimentacao,
} from "./estoque-service.js";
import {
  createDeliveryZone,
  deleteDeliveryZone,
  listDeliveryZones,
  updateDeliveryZone,
  type DeliveryZoneInput,
} from "./delivery-zones-service.js";
import { getPromocoes } from "./promocoes-service.js";
import {
  getDeliveryZones,
  getStoreHours,
  getStoreSettings,
  updateDeliveryZones,
  updateStoreHours,
  updateStoreSettings,
} from "./store-service.js";

const OrderFiltersSchema = Type.Object({
  status: Type.Optional(Type.String()),
  search: Type.Optional(Type.String()),
  page: Type.Optional(Type.Integer({ minimum: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
});

const StatusUpdateSchema = Type.Object({
  status: Type.Union([
    Type.Literal("pending"),
    Type.Literal("confirmed"),
    Type.Literal("preparing"),
    Type.Literal("ready_for_delivery"),
    Type.Literal("out_for_delivery"),
    Type.Literal("delivered"),
    Type.Literal("cancelled"),
  ]),
  note: Type.Optional(Type.String()),
});

const ManualOrderSchema = Type.Object({
  customer: Type.Object({
    name: Type.String(),
    phone: Type.String(),
    email: Type.Optional(Type.String({ format: "email" })),
  }),
  items: Type.Array(Type.Object({ productId: Type.String(), quantity: Type.Integer({ minimum: 1 }) }), {
    minItems: 1,
  }),
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

const ProductUpsertSchema = Type.Object({
  name: Type.String(),
  slug: Type.String(),
  categoryId: Type.Optional(Type.String()),
  listPriceCents: Type.Integer({ minimum: 0 }),
  salePriceCents: Type.Optional(Type.Integer({ minimum: 0 })),
});

const AvailabilitySchema = Type.Object({
  isAvailable: Type.Boolean(),
});

const InventoryMovementSchema = Type.Object({
  productId: Type.String(),
  quantityDelta: Type.Integer(),
  reason: Type.String(),
});

const CategoryCreateSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  slug: Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" }),
  isActive: Type.Optional(Type.Boolean()),
});

const CategoryPatchSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  slug: Type.Optional(Type.String({ minLength: 1, pattern: "^[a-z0-9-]+$" })),
  isActive: Type.Optional(Type.Boolean()),
});

const CustomerUpdateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  isInactive: Type.Optional(Type.Boolean()),
});

const StoreSettingsSchema = Type.Object({
  name: Type.Optional(Type.String()),
  whatsappPhone: Type.Optional(Type.String()),
  minimumOrderValueCents: Type.Optional(Type.Integer({ minimum: 0 })),
});

const StoreHourSchema = Type.Object({
  dayOfWeek: Type.Integer({ minimum: 0, maximum: 6 }),
  opensAt: Type.String({ pattern: "^\\d{2}:\\d{2}$" }),
  closesAt: Type.String({ pattern: "^\\d{2}:\\d{2}$" }),
  isClosed: Type.Optional(Type.Boolean()),
});
const StoreHoursBodySchema = Type.Array(StoreHourSchema, { maxItems: 7 });

const DeliveryZoneInputSchema = Type.Object({
  id: Type.Optional(Type.String()),
  label: Type.String({ minLength: 1, maxLength: 200 }),
  feeCents: Type.Integer({ minimum: 0 }),
  etaMinutes: Type.String(),
  neighborhoods: Type.Array(Type.String()),
  radiusKm: Type.Number({ minimum: 0 }),
});
const DeliveryZonesBodySchema = Type.Array(DeliveryZoneInputSchema);

const DeliveryZoneBodySchema = Type.Object({
  label: Type.String({ minLength: 1 }),
  mode: Type.Union([Type.Literal("radius"), Type.Literal("neighborhoods")]),
  radiusKm: Type.Optional(Type.Number({ minimum: 0 })),
  neighborhoods: Type.Optional(Type.Array(Type.String())),
  centerLat: Type.Optional(Type.Number()),
  centerLng: Type.Optional(Type.Number()),
  feeCents: Type.Integer({ minimum: 0 }),
  etaMinutes: Type.Integer({ minimum: 1 }),
  minimumOrderCents: Type.Optional(Type.Integer({ minimum: 0 })),
  freeShippingAboveCents: Type.Optional(Type.Integer({ minimum: 0 })),
});

const LojaUpdateSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  slug: Type.Optional(Type.String({ pattern: "^[a-z0-9-]+$" })),
  whatsappPhone: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([Type.Literal("open"), Type.Literal("closed"), Type.Literal("paused")])),
  minimumOrderValueCents: Type.Optional(Type.Integer({ minimum: 0 })),
});

const ContaBancariaUpdateSchema = Type.Object({
  keyType: Type.Union([
    Type.Literal("cpf"),
    Type.Literal("cnpj"),
    Type.Literal("telefone"),
    Type.Literal("email"),
    Type.Literal("aleatoria"),
  ]),
  pixKey: Type.String({ minLength: 1 }),
  bankName: Type.Optional(Type.String()),
});

const ConviteSchema = Type.Object({
  email: Type.String({ format: "email" }),
  role: Type.Union([Type.Literal("manager"), Type.Literal("operator")]),
});

type LojaUpdateBody = Static<typeof LojaUpdateSchema>;
type ContaBancariaUpdateBody = Static<typeof ContaBancariaUpdateSchema>;
type ConviteBody = Static<typeof ConviteSchema>;

type OrderFilters = Static<typeof OrderFiltersSchema>;
type StatusUpdateBody = Static<typeof StatusUpdateSchema>;
type ManualOrderBody = Static<typeof ManualOrderSchema>;
type ProductUpsertBody = Static<typeof ProductUpsertSchema>;
type AvailabilityBody = Static<typeof AvailabilitySchema>;
type InventoryMovementBody = Static<typeof InventoryMovementSchema>;
type CategoryCreateBody = Static<typeof CategoryCreateSchema>;
type CategoryPatchBody = Static<typeof CategoryPatchSchema>;
type CustomerUpdateBody = Static<typeof CustomerUpdateSchema>;
type StoreSettingsBody = Static<typeof StoreSettingsSchema>;
type StoreHourBody = Static<typeof StoreHourSchema>;
type DeliveryZoneInputBody = Static<typeof DeliveryZoneInputSchema>;
type DeliveryZoneBody = Static<typeof DeliveryZoneBodySchema>;

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }

  return request.partnerContext as PartnerContext;
}

export const partnerRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

  // ─── Categorias ─────────────────────────────────────────────────────────────

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
      reply.code(201);
      return ok(await createPartnerCategory(partnerContext(request), request.body));
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
        return reply.code(404).send(ok({ message: "Categoria nao encontrada." }));
      }
      return ok(category);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/categories/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const result = await deletePartnerCategory(partnerContext(request), request.params.id);
      if ("error" in result) {
        return reply.code(400).send(ok({ message: result.error }));
      }
      return ok(result);
    },
  );

  // ─── Dashboard ───────────────────────────────────────────────────────────────

  app.get("/partner/dashboard/summary", { schema: { response: { 200: envelopeSchema(Type.Any()) } } }, async (request) =>
    ok(await getDashboardSummary(partnerContext(request))),
  );

  app.get<{ Querystring: { from?: string; to?: string } }>(
    "/partner/reports",
    {
      schema: {
        querystring: Type.Object({
          from: Type.Optional(Type.String()),
          to: Type.Optional(Type.String()),
        }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      try {
        return ok(await getPartnerReports(partnerContext(request), request.query));
      } catch (err) {
        if (err instanceof Error && err.message.includes("90 dias")) {
          return reply.code(400).send({ error: err.message });
        }
        throw err;
      }
    },
  );

  app.get<{ Querystring: OrderFilters }>(
    "/partner/orders",
    {
      schema: {
        querystring: OrderFiltersSchema,
        response: {
          200: envelopeSchema(
            Type.Object({
              orders: Type.Array(Type.Any()),
              total: Type.Integer(),
              page: Type.Integer(),
              pageSize: Type.Integer(),
            }),
          ),
        },
      },
    },
    async (request) => ok(await listPartnerOrders(partnerContext(request), request.query)),
  );

  app.get<{ Params: { id: string } }>(
    "/partner/orders/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const order = await getPartnerOrderById(partnerContext(request), request.params.id);
      if (!order) {
        return reply.code(404).send(ok({ message: "Pedido nao encontrado." }));
      }
      return ok(order);
    },
  );

  app.patch<{ Params: { id: string }; Body: StatusUpdateBody }>(
    "/partner/orders/:id/status",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: StatusUpdateSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const order = await updatePartnerOrderStatus(partnerContext(request), request.params.id, request.body);
      if (!order) {
        return reply.code(404).send(ok({ message: "Pedido nao encontrado." }));
      }
      return ok(order);
    },
  );

  app.post<{ Body: ManualOrderBody }>(
    "/partner/orders/manual",
    {
      schema: {
        body: ManualOrderSchema,
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      reply.code(201);
      return ok(await createManualPartnerOrder(partnerContext(request), request.body));
    },
  );

  app.get<{ Querystring: { from?: string; to?: string; status?: string } }>(
    "/partner/orders/export",
    {
      schema: {
        querystring: Type.Object({
          from: Type.Optional(Type.String()),
          to: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
        }),
      },
    },
    async (request, reply) => {
      const csv = await exportPartnerOrdersCSV(partnerContext(request), request.query);
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", 'attachment; filename="pedidos.csv"');
      return reply.send(csv);
    },
  );

  app.get("/partner/products", { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } }, async (request) =>
    ok(await listPartnerProducts(partnerContext(request))),
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
        return reply.code(404).send(ok({ message: "Produto nao encontrado." }));
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
        return reply.code(404).send(ok({ message: "Produto nao encontrado." }));
      }
      return ok(product);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/products/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const product = await deletePartnerProduct(partnerContext(request), request.params.id);
      if (!product) {
        return reply.code(404).send(ok({ message: "Produto nao encontrado." }));
      }
      return ok(product);
    },
  );

  app.get("/partner/inventory", { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } }, async (request) =>
    ok(await getInventory(partnerContext(request))),
  );

  app.post<{ Body: InventoryMovementBody }>(
    "/partner/inventory/movements",
    {
      schema: {
        body: InventoryMovementSchema,
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const movement = await createInventoryMovement(partnerContext(request), request.body);
      if (!movement) {
        return reply.code(404).send(ok({ message: "Item de estoque nao encontrado." }));
      }
      reply.code(201);
      return ok(movement);
    },
  );

  // ─── Gestão de Estoque (Grupo 1) ─────────────────────────────────────────────

  app.get(
    "/partner/estoque",
    { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } },
    async (request) => ok(await getEstoque(partnerContext(request))),
  );

  app.post<{
    Body: {
      productId: string;
      tipo: string;
      quantidade: number;
      motivo: string;
      dataHora?: string;
    };
  }>(
    "/partner/estoque/movimentacao",
    {
      schema: {
        body: Type.Object({
          productId: Type.String(),
          tipo: Type.String(),
          quantidade: Type.Integer(),
          motivo: Type.String({ minLength: 1 }),
          dataHora: Type.Optional(Type.String()),
        }),
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const resultado = await registrarMovimentacao(partnerContext(request), request.body);
      if (!resultado) {
        return reply.code(404).send(ok({ message: "Item de estoque nao encontrado." }));
      }
      reply.code(201);
      return ok(resultado);
    },
  );

  app.get<{ Params: { productId: string }; Querystring: { page?: number; pageSize?: number } }>(
    "/partner/estoque/:productId/historico",
    {
      schema: {
        params: Type.Object({ productId: Type.String() }),
        querystring: Type.Object({
          page: Type.Optional(Type.Integer({ minimum: 1 })),
          pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
        }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const { productId } = request.params;
      const { page, pageSize } = request.query;
      const historico = await getHistoricoEstoque(
        partnerContext(request),
        productId,
        page ?? 1,
        pageSize ?? 20,
      );
      if (!historico) {
        return reply.code(404).send(ok({ message: "Item de estoque nao encontrado." }));
      }
      return ok(historico);
    },
  );

  app.get("/partner/customers", { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } }, async (request) =>
    ok(await listCustomers(partnerContext(request))),
  );

  app.get<{ Params: { id: string } }>(
    "/partner/customers/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const customer = await getCustomerById(partnerContext(request), request.params.id);
      if (!customer) {
        return reply.code(404).send(ok({ message: "Cliente nao encontrado." }));
      }
      return ok(customer);
    },
  );

  app.patch<{ Params: { id: string }; Body: CustomerUpdateBody }>(
    "/partner/customers/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: CustomerUpdateSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const customer = await updateCustomer(partnerContext(request), request.params.id, request.body);
      if (!customer) {
        return reply.code(404).send(ok({ message: "Cliente nao encontrado." }));
      }
      return ok(customer);
    },
  );

  // ── Tags do cliente ──────────────────────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    "/partner/customers/:id/tags",
    { schema: { params: Type.Object({ id: Type.String() }), response: { 200: envelopeSchema(Type.Any()) } } },
    async (request, reply) => {
      const tags = await listCustomerTags(partnerContext(request), request.params.id);
      if (tags === null) return reply.code(404).send(ok({ message: "Cliente nao encontrado." }));
      return ok(tags);
    },
  );

  app.post<{ Params: { id: string }; Body: { label: string } }>(
    "/partner/customers/:id/tags",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Object({ label: Type.String({ minLength: 1, maxLength: 50 }) }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const tag = await addCustomerTag(partnerContext(request), request.params.id, request.body.label.trim());
      if (tag === null) return reply.code(404).send(ok({ message: "Cliente nao encontrado." }));
      return ok(tag);
    },
  );

  app.delete<{ Params: { id: string; label: string } }>(
    "/partner/customers/:id/tags/:label",
    { schema: { params: Type.Object({ id: Type.String(), label: Type.String() }), response: { 200: envelopeSchema(Type.Any()) } } },
    async (request, reply) => {
      const removed = await removeCustomerTag(
        partnerContext(request),
        request.params.id,
        decodeURIComponent(request.params.label),
      );
      if (!removed) return reply.code(404).send(ok({ message: "Tag nao encontrada." }));
      return ok({ removed: true });
    },
  );

  // ── Notas do cliente (append-only) ───────────────────────────────────────
  app.get<{ Params: { id: string } }>(
    "/partner/customers/:id/notas",
    { schema: { params: Type.Object({ id: Type.String() }), response: { 200: envelopeSchema(Type.Any()) } } },
    async (request, reply) => {
      const notas = await listCustomerNotes(partnerContext(request), request.params.id);
      if (notas === null) return reply.code(404).send(ok({ message: "Cliente nao encontrado." }));
      return ok(notas);
    },
  );

  app.post<{ Params: { id: string }; Body: { body: string } }>(
    "/partner/customers/:id/notas",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Object({ body: Type.String({ minLength: 1 }) }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const nota = await addCustomerNote(partnerContext(request), request.params.id, request.body.body.trim());
      if (nota === null) return reply.code(404).send(ok({ message: "Cliente nao encontrado." }));
      return reply.code(201).send(ok(nota));
    },
  );

  app.get("/partner/store/settings", { schema: { response: { 200: envelopeSchema(Type.Any()) } } }, async (request) =>
    ok(await getStoreSettings(partnerContext(request))),
  );

  app.patch<{ Body: StoreSettingsBody }>(
    "/partner/store/settings",
    {
      schema: {
        body: StoreSettingsSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request) => ok(await updateStoreSettings(partnerContext(request), request.body)),
  );

  app.get(
    "/partner/store/hours",
    { schema: { response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await getStoreHours(partnerContext(request))),
  );

  app.patch<{ Body: StoreHourBody[] }>(
    "/partner/store/hours",
    { schema: { body: StoreHoursBodySchema, response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await updateStoreHours(partnerContext(request), request.body)),
  );

  app.get(
    "/partner/store/delivery-zones",
    { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } },
    async (request) => ok(await getDeliveryZones(partnerContext(request))),
  );

  app.patch<{ Body: DeliveryZoneInputBody[] }>(
    "/partner/store/delivery-zones",
    {
      schema: {
        body: DeliveryZonesBodySchema,
        response: { 200: envelopeSchema(Type.Array(Type.Any())) },
      },
    },
    async (request) => ok(await updateDeliveryZones(partnerContext(request), request.body)),
  );

  // ─── Zonas de Entrega (Grupo 3) ──────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/zonas-entrega",
    { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } },
    async (request) => ok(await listDeliveryZones(partnerContext(request))),
  );

  app.post<{ Body: DeliveryZoneBody }>(
    "/partner/configuracoes/zonas-entrega",
    {
      schema: {
        body: DeliveryZoneBodySchema,
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      reply.code(201);
      const input: DeliveryZoneInput = {
        label: request.body.label,
        mode: request.body.mode,
        radiusKm: request.body.radiusKm,
        neighborhoods: request.body.neighborhoods,
        centerLat: request.body.centerLat,
        centerLng: request.body.centerLng,
        feeCents: request.body.feeCents,
        etaMinutes: request.body.etaMinutes,
        minimumOrderCents: request.body.minimumOrderCents,
        freeShippingAboveCents: request.body.freeShippingAboveCents,
      };
      return ok(await createDeliveryZone(partnerContext(request), input));
    },
  );

  app.put<{ Params: { id: string }; Body: Partial<DeliveryZoneBody> }>(
    "/partner/configuracoes/zonas-entrega/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Partial(DeliveryZoneBodySchema),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const zona = await updateDeliveryZone(partnerContext(request), request.params.id, request.body as Partial<DeliveryZoneInput>);
      if (!zona) {
        return reply.code(404).send(ok({ message: "Zona de entrega nao encontrada." }));
      }
      return ok(zona);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/configuracoes/zonas-entrega/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const zona = await deleteDeliveryZone(partnerContext(request), request.params.id);
      if (!zona) {
        return reply.code(404).send(ok({ message: "Zona de entrega nao encontrada." }));
      }
      return ok(zona);
    },
  );

  // ─── Central de Promoções ────────────────────────────────────────────────────

  app.get(
    "/partner/promocoes",
    { schema: { response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await getPromocoes(partnerContext(request).storeId)),
  );

  // ─── Configurações da Conta ───────────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/loja",
    { schema: { response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await getLoja(partnerContext(request))),
  );

  app.put<{ Body: LojaUpdateBody }>(
    "/partner/configuracoes/loja",
    {
      schema: {
        body: LojaUpdateSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request) => ok(await updateLoja(partnerContext(request), request.body)),
  );

  app.get(
    "/partner/configuracoes/horarios",
    { schema: { response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await getStoreHours(partnerContext(request))),
  );

  app.put<{ Body: StoreHourBody[] }>(
    "/partner/configuracoes/horarios",
    { schema: { body: StoreHoursBodySchema, response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await updateStoreHours(partnerContext(request), request.body)),
  );

  app.get(
    "/partner/configuracoes/conta-bancaria",
    { schema: { response: { 200: envelopeSchema(Type.Any()) } } },
    async (request) => ok(await getContaBancaria(partnerContext(request))),
  );

  app.put<{ Body: ContaBancariaUpdateBody }>(
    "/partner/configuracoes/conta-bancaria",
    {
      schema: {
        body: ContaBancariaUpdateSchema,
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request) => ok(await upsertContaBancaria(partnerContext(request), request.body)),
  );

  app.get(
    "/partner/configuracoes/usuarios",
    { schema: { response: { 200: envelopeSchema(Type.Array(Type.Any())) } } },
    async (request) => ok(await listUsuarios(partnerContext(request))),
  );

  app.post<{ Body: ConviteBody }>(
    "/partner/configuracoes/usuarios/convidar",
    {
      schema: {
        body: ConviteSchema,
        response: { 201: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const dados = await convidarUsuario(partnerContext(request), request.body);
      reply.code(201);
      return ok(dados, { stub: true });
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/configuracoes/usuarios/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(Type.Any()) },
      },
    },
    async (request, reply) => {
      const resultado = await revogarUsuario(partnerContext(request), request.params.id);
      if (!resultado) {
        return reply.code(400).send(ok({ message: "Nao foi possivel revogar o usuario." }));
      }
      return ok(resultado);
    },
  );
};
