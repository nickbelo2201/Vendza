import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok, notFound } from "../../lib/http.js";
import {
  createManualPartnerOrder,
  exportPartnerOrdersCSV,
  getPartnerOrderById,
  listPartnerOrders,
  updatePartnerOrderStatus,
} from "./orders-service.js";
import { type PartnerContext } from "./context.js";

// ─── Schemas TypeBox ──────────────────────────────────────────────────────────

// ─── Schemas de resposta ──────────────────────────────────────────────────────

/** Schema de item de pedido partner */
const PartnerOrderItemSchema = Type.Object({
  productId: Type.String(),
  title: Type.String(),
  quantity: Type.Integer(),
  unitPriceCents: Type.Integer(),
  totalCents: Type.Integer(),
});

/** Schema de endereço de entrega */
const PartnerOrderAddressSchema = Type.Object({
  line1: Type.String(),
  number: Type.Optional(Type.String()),
  neighborhood: Type.String(),
  city: Type.String(),
  state: Type.String(),
});

/** Schema de evento de timeline de pedido partner */
const PartnerOrderTimelineEventSchema = Type.Object({
  type: Type.String(),
  label: Type.String(),
  createdAt: Type.String(),
  note: Type.Optional(Type.String()),
  operadorId: Type.Union([Type.String(), Type.Null()]),
});

/** Schema completo de pedido partner */
const PartnerOrderSchema = Type.Object({
  id: Type.String(),
  publicId: Type.String(),
  status: Type.String(),
  channel: Type.String(),
  customerId: Type.String(),
  customerName: Type.String(),
  customerPhone: Type.String(),
  paymentMethod: Type.String(),
  subtotalCents: Type.Integer(),
  deliveryFeeCents: Type.Integer(),
  discountCents: Type.Integer(),
  totalCents: Type.Integer(),
  placedAt: Type.String(),
  note: Type.Union([Type.String(), Type.Null()]),
  address: PartnerOrderAddressSchema,
  items: Type.Array(PartnerOrderItemSchema),
  timeline: Type.Array(PartnerOrderTimelineEventSchema),
});

/** Schema de pedido criado com URL de rastreamento */
const PartnerOrderCreatedSchema = Type.Intersect([
  PartnerOrderSchema,
  Type.Object({ trackingUrl: Type.String() }),
]);

/** Schema de listagem de pedidos partner */
const PartnerOrderListSchema = Type.Object({
  orders: Type.Array(PartnerOrderSchema),
  total: Type.Integer(),
  page: Type.Integer(),
  pageSize: Type.Integer(),
});

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
    phone: Type.Optional(Type.String()),
    email: Type.Optional(Type.String({ format: "email" })),
  }),
  items: Type.Array(Type.Object({ productId: Type.String(), quantity: Type.Integer({ minimum: 1 }) }), {
    minItems: 1,
  }),
  address: Type.Optional(Type.Object({
    line1: Type.String(),
    number: Type.Optional(Type.String()),
    neighborhood: Type.String(),
    city: Type.String(),
    state: Type.String(),
  })),
  deliveryType: Type.Optional(Type.Union([Type.Literal("balcao"), Type.Literal("delivery")])),
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

type OrderFilters = Static<typeof OrderFiltersSchema>;
type StatusUpdateBody = Static<typeof StatusUpdateSchema>;
type ManualOrderBody = Static<typeof ManualOrderSchema>;

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function ordersRoutes(app: FastifyInstance) {
  app.get<{ Querystring: OrderFilters }>(
    "/partner/orders",
    {
      schema: {
        querystring: OrderFiltersSchema,
        response: {
          200: envelopeSchema(PartnerOrderListSchema),
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
        response: { 200: envelopeSchema(PartnerOrderSchema) },
      },
    },
    async (request, reply) => {
      const order = await getPartnerOrderById(partnerContext(request), request.params.id);
      if (!order) {
        return reply.code(404).send(notFound("Pedido nao encontrado."));
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
        response: { 200: envelopeSchema(PartnerOrderSchema) },
      },
    },
    async (request, reply) => {
      const order = await updatePartnerOrderStatus(partnerContext(request), request.params.id, request.body);
      if (!order) {
        return reply.code(404).send(notFound("Pedido nao encontrado."));
      }
      return ok(order);
    },
  );

  app.post<{ Body: ManualOrderBody }>(
    "/partner/orders/manual",
    {
      schema: {
        body: ManualOrderSchema,
        response: { 201: envelopeSchema(PartnerOrderCreatedSchema) },
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
      // Rate limit restritivo: exportação CSV pode gerar carga elevada no banco
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        querystring: Type.Object({
          from: Type.Optional(Type.String()),
          to: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
        }),
      },
    },
    async (request, reply) => {
      const { from, to, status } = request.query;
      if (!from || !to) {
        return reply.code(400).send({ error: "Os parâmetros 'from' e 'to' são obrigatórios para exportação." });
      }
      const csv = await exportPartnerOrdersCSV(partnerContext(request), { from: from!, to: to!, status });
      reply.header("Content-Type", "text/csv");
      reply.header("Content-Disposition", 'attachment; filename="pedidos.csv"');
      return reply.send(csv);
    },
  );
}
