import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok, notFound } from "../../lib/http.js";
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
import { type PartnerContext } from "./context.js";

// ─── Schemas TypeBox ──────────────────────────────────────────────────────────

// ─── Schemas de resposta ──────────────────────────────────────────────────────

/** Schema de cliente resumido */
const CustomerSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  phone: Type.String(),
  email: Type.Union([Type.String(), Type.Null()]),
  totalSpentCents: Type.Integer(),
  isInactive: Type.Boolean(),
  lastOrderAt: Type.Union([Type.String(), Type.Null()]),
});

/** Schema de listagem paginada de clientes */
const CustomerListSchema = Type.Object({
  items: Type.Array(CustomerSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    pageSize: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
  }),
});

/** Schema de tag do cliente */
const CustomerTagSchema = Type.Object({
  id: Type.String(),
  label: Type.String(),
  createdAt: Type.Unsafe<Date | string>({}),
});

/** Schema de nota do cliente */
const CustomerNoteSchema = Type.Object({
  id: Type.String(),
  body: Type.String(),
  createdAt: Type.Unsafe<Date | string>({}),
});

/** Schema de resumo do dashboard */
const DashboardSummarySchema = Type.Object({
  ordersToday: Type.Integer(),
  revenueCents: Type.Integer(),
  averageTicketCents: Type.Integer(),
  recurringCustomers: Type.Integer(),
  newCustomers: Type.Integer(),
});

/** Schema de item de receita por dia */
const RevenueByDaySchema = Type.Object({ date: Type.String(), revenueCents: Type.Integer() });

/** Schema de produto top */
const TopProductSchema = Type.Object({
  name: Type.String(),
  quantity: Type.Integer(),
  revenueCents: Type.Integer(),
});

/** Schema de distribuição de pagamento */
const PaymentDistributionSchema = Type.Object({ method: Type.String(), count: Type.Integer() });

/** Schema de vendas por hora */
const SalesByHourSchema = Type.Object({ hour: Type.Integer(), count: Type.Integer(), revenueCents: Type.Integer() });

/** Schema de top cliente */
const TopClienteSchema = Type.Object({
  name: Type.String(),
  totalOrders: Type.Integer(),
  totalRevenueCents: Type.Integer(),
  firstOrderDate: Type.String(),
  lastOrderDate: Type.String(),
});

/** Schema de relatório partner */
const PartnerReportSchema = Type.Object({
  period: Type.Object({ from: Type.String(), to: Type.String() }),
  totalRevenueCents: Type.Integer(),
  totalOrders: Type.Integer(),
  averageTicketCents: Type.Integer(),
  newCustomers: Type.Integer(),
  topProducts: Type.Array(TopProductSchema),
  revenueByDay: Type.Array(RevenueByDaySchema),
  cancelledOrders: Type.Integer(),
  cancellationRate: Type.Number(),
  repeatCustomers: Type.Integer(),
  repeatRate: Type.Number(),
  paymentDistribution: Type.Array(PaymentDistributionSchema),
  salesByHour: Type.Array(SalesByHourSchema),
  topClientes: Type.Array(TopClienteSchema),
});

/** Schema de remoção de tag */
const RemovedTagSchema = Type.Object({ removed: Type.Literal(true) });

/** Schema de perfil do usuário autenticado */
const MeSchema = Type.Object({
  userId: Type.String(),
  storeId: Type.String(),
  role: Type.String(),
});

const CustomerUpdateSchema = Type.Object({
  name: Type.Optional(Type.String()),
  isInactive: Type.Optional(Type.Boolean()),
});

const CustomerListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 200, default: 50 })),
  search: Type.Optional(Type.String()),
});

type CustomerUpdateBody = Static<typeof CustomerUpdateSchema>;

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function crmRoutes(app: FastifyInstance) {
  // ─── Dashboard e Relatórios ───────────────────────────────────────────────

  app.get("/partner/dashboard/summary", { schema: { response: { 200: envelopeSchema(DashboardSummarySchema) } } }, async (request) =>
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
        response: { 200: envelopeSchema(PartnerReportSchema) },
      },
    },
    async (request, reply) => {
      try {
        return ok(await getPartnerReports(partnerContext(request), request.query));
      } catch (err) {
        if (err instanceof Error && err.message.includes("90 dias")) {
          return reply.code(400).send({
            data: null,
            meta: { requestedAt: new Date().toISOString(), stub: false },
            error: { code: "PERIOD_TOO_LONG", message: err.message },
          });
        }
        throw err;
      }
    },
  );

  // ─── Clientes ─────────────────────────────────────────────────────────────

  app.get<{ Querystring: { page?: number; pageSize?: number; search?: string } }>(
    "/partner/customers",
    {
      schema: {
        querystring: CustomerListQuerySchema,
        response: { 200: envelopeSchema(CustomerListSchema) },
      },
    },
    async (request) =>
      ok(await listCustomers(partnerContext(request), request.query)),
  );

  app.get<{ Params: { id: string } }>(
    "/partner/customers/:id",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(CustomerSchema) },
      },
    },
    async (request, reply) => {
      const customer = await getCustomerById(partnerContext(request), request.params.id);
      if (!customer) {
        return reply.code(404).send(notFound("Cliente nao encontrado."));
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
        response: { 200: envelopeSchema(CustomerSchema) },
      },
    },
    async (request, reply) => {
      const customer = await updateCustomer(partnerContext(request), request.params.id, request.body);
      if (!customer) {
        return reply.code(404).send(notFound("Cliente nao encontrado."));
      }
      return ok(customer);
    },
  );

  // ── Tags do cliente ─────────────────────────────────────────────────────

  app.get<{ Params: { id: string } }>(
    "/partner/customers/:id/tags",
    { schema: { params: Type.Object({ id: Type.String() }), response: { 200: envelopeSchema(Type.Array(CustomerTagSchema)) } } },
    async (request, reply) => {
      const tags = await listCustomerTags(partnerContext(request), request.params.id);
      if (tags === null) return reply.code(404).send(notFound("Cliente nao encontrado."));
      return ok(tags);
    },
  );

  app.post<{ Params: { id: string }; Body: { label: string } }>(
    "/partner/customers/:id/tags",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Object({ label: Type.String({ minLength: 1, maxLength: 50 }) }),
        response: { 200: envelopeSchema(CustomerTagSchema) },
      },
    },
    async (request, reply) => {
      const tag = await addCustomerTag(partnerContext(request), request.params.id, request.body.label.trim());
      if (tag === null) return reply.code(404).send(notFound("Cliente nao encontrado."));
      return ok(tag);
    },
  );

  app.delete<{ Params: { id: string; label: string } }>(
    "/partner/customers/:id/tags/:label",
    { schema: { params: Type.Object({ id: Type.String(), label: Type.String() }), response: { 200: envelopeSchema(RemovedTagSchema) } } },
    async (request, reply) => {
      const removed = await removeCustomerTag(
        partnerContext(request),
        request.params.id,
        decodeURIComponent(request.params.label),
      );
      if (!removed) return reply.code(404).send(notFound("Tag nao encontrada."));
      return ok({ removed: true });
    },
  );

  // ── Notas do cliente (append-only) ──────────────────────────────────────

  app.get<{ Params: { id: string } }>(
    "/partner/customers/:id/notas",
    { schema: { params: Type.Object({ id: Type.String() }), response: { 200: envelopeSchema(Type.Array(CustomerNoteSchema)) } } },
    async (request, reply) => {
      const notas = await listCustomerNotes(partnerContext(request), request.params.id);
      if (notas === null) return reply.code(404).send(notFound("Cliente nao encontrado."));
      return ok(notas);
    },
  );

  app.post<{ Params: { id: string }; Body: { body: string } }>(
    "/partner/customers/:id/notas",
    {
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Object({ body: Type.String({ minLength: 1 }) }),
        response: { 200: envelopeSchema(CustomerNoteSchema) },
      },
    },
    async (request, reply) => {
      const nota = await addCustomerNote(partnerContext(request), request.params.id, request.body.body.trim());
      if (nota === null) return reply.code(404).send(notFound("Cliente nao encontrado."));
      return reply.code(201).send(ok(nota));
    },
  );
}
