import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import {
  createInventoryMovement,
  createPartnerProduct,
  deletePartnerProduct,
  getInventory,
  listPartnerProducts,
  updatePartnerProduct,
  updateProductAvailability,
} from "./catalog-service.js";
import { type PartnerContext } from "./context.js";
import {
  getCustomerById,
  getDashboardSummary,
  getPartnerReports,
  listCustomers,
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

type OrderFilters = Static<typeof OrderFiltersSchema>;
type StatusUpdateBody = Static<typeof StatusUpdateSchema>;
type ManualOrderBody = Static<typeof ManualOrderSchema>;
type ProductUpsertBody = Static<typeof ProductUpsertSchema>;
type AvailabilityBody = Static<typeof AvailabilitySchema>;
type InventoryMovementBody = Static<typeof InventoryMovementSchema>;
type CustomerUpdateBody = Static<typeof CustomerUpdateSchema>;
type StoreSettingsBody = Static<typeof StoreSettingsSchema>;
type StoreHourBody = Static<typeof StoreHourSchema>;
type DeliveryZoneInputBody = Static<typeof DeliveryZoneInputSchema>;

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }

  return request.partnerContext as PartnerContext;
}

export const partnerRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", app.authenticate);

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
        response: { 200: envelopeSchema(Type.Array(Type.Any())) },
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
};
