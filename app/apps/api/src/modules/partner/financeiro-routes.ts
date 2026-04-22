import { Type } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import {
  getFinanceiroKpis,
  getExtratoFinanceiro,
  exportarFinanceiro,
} from "./financeiro-service.js";
import { type PartnerContext } from "./context.js";
import { requireRole } from "./require-role.js";

// ─── Schemas de resposta ──────────────────────────────────────────────────────

/** Schema de KPI com comparação de período anterior */
const KpiComComparacaoSchema = Type.Object({
  centavos: Type.Integer(),
  comparacao: Type.Union([Type.Number(), Type.Null()]),
});

/** Schema de KPIs financeiros */
const FinanceiroKpisSchema = Type.Object({
  kpis: Type.Object({
    receitaBruta: KpiComComparacaoSchema,
    receitaLiquida: KpiComComparacaoSchema,
    pedidosPagos: Type.Object({
      count: Type.Integer(),
      centavos: Type.Integer(),
      comparacao: Type.Union([Type.Number(), Type.Null()]),
    }),
    pedidosPendentes: Type.Object({
      count: Type.Integer(),
      centavos: Type.Integer(),
      pendentesAntigoCount: Type.Integer(),
    }),
    ticketMedio: KpiComComparacaoSchema,
    cancelamentos: Type.Object({
      count: Type.Integer(),
      centavos: Type.Integer(),
      comparacao: Type.Union([Type.Number(), Type.Null()]),
    }),
  }),
  receitaPorDia: Type.Array(Type.Object({
    date: Type.String(),
    pagoCentavos: Type.Integer(),
    totalCentavos: Type.Integer(),
    pedidos: Type.Integer(),
  })),
  breakdownStatus: Type.Array(Type.Object({
    status: Type.String(),
    label: Type.String(),
    count: Type.Integer(),
    centavos: Type.Integer(),
  })),
  breakdownMetodo: Type.Array(Type.Object({
    method: Type.String(),
    label: Type.String(),
    count: Type.Integer(),
    centavos: Type.Integer(),
  })),
});

/** Schema de item do extrato financeiro */
const ExtratoItemSchema = Type.Object({
  id: Type.String(),
  publicId: Type.String(),
  dataHora: Type.String(),
  cliente: Type.String(),
  valorBrutoCentavos: Type.Integer(),
  taxasCentavos: Type.Integer(),
  valorLiquidoCentavos: Type.Integer(),
  metodoPagamento: Type.String(),
  statusPagamento: Type.String(),
});

/** Schema de extrato paginado */
const ExtratoFinanceiroSchema = Type.Object({
  data: Type.Array(ExtratoItemSchema),
  total: Type.Integer(),
  page: Type.Integer(),
  pageSize: Type.Integer(),
  totalFiltradoCentavos: Type.Integer(),
});

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function financeiroRoutes(app: FastifyInstance) {
  app.get<{ Querystring: { from?: string; to?: string } }>(
    "/partner/financeiro",
    {
      schema: {
        querystring: Type.Object({ from: Type.Optional(Type.String()), to: Type.Optional(Type.String()) }),
        response: { 200: envelopeSchema(FinanceiroKpisSchema) },
      },
    },
    async (request) => {
      const { from, to } = request.query;
      const agora = new Date();
      const dataFim = to ? new Date(to) : agora;
      const dataInicio = from ? new Date(from) : new Date(agora.getFullYear(), agora.getMonth(), 1);
      return ok(await getFinanceiroKpis(partnerContext(request), dataInicio, dataFim));
    },
  );

  app.get<{
    Querystring: {
      from?: string;
      to?: string;
      status?: string;
      metodo?: string;
      busca?: string;
      page?: number;
      pageSize?: number;
      orderBy?: string;
      orderDir?: string;
    };
  }>(
    "/partner/financeiro/extrato",
    {
      schema: {
        querystring: Type.Object({
          from: Type.Optional(Type.String()),
          to: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
          metodo: Type.Optional(Type.String()),
          busca: Type.Optional(Type.String()),
          page: Type.Optional(Type.Integer({ minimum: 1 })),
          pageSize: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
          orderBy: Type.Optional(Type.String()),
          orderDir: Type.Optional(Type.String()),
        }),
        response: { 200: envelopeSchema(ExtratoFinanceiroSchema) },
      },
    },
    async (request) => {
      const { from, to, status, metodo, busca, page, pageSize, orderBy, orderDir } = request.query;
      const agora = new Date();
      const dataFim = to ? new Date(to) : agora;
      const dataInicio = from ? new Date(from) : new Date(agora.getFullYear(), agora.getMonth(), 1);
      return ok(
        await getExtratoFinanceiro(partnerContext(request), {
          from: dataInicio,
          to: dataFim,
          status,
          metodo,
          busca,
          page: page ?? 1,
          pageSize: pageSize ?? 20,
          orderBy,
          orderDir: orderDir as "asc" | "desc" | undefined,
        }),
      );
    },
  );

  app.get<{ Querystring: { from?: string; to?: string; tipo?: string; status?: string; metodo?: string } }>(
    "/partner/financeiro/exportar",
    {
      preHandler: requireRole("owner", "manager"),
      // Rate limit restritivo: exportação financeira pode gerar carga elevada e expõe dados sensíveis
      config: { rateLimit: { max: 5, timeWindow: "1 minute" } },
      schema: {
        querystring: Type.Object({
          from: Type.Optional(Type.String()),
          to: Type.Optional(Type.String()),
          tipo: Type.Optional(Type.String()),
          status: Type.Optional(Type.String()),
          metodo: Type.Optional(Type.String()),
        }),
      },
    },
    async (request, reply) => {
      const { from, to, tipo, status, metodo } = request.query;
      const agora = new Date();
      const dataFim = to ? new Date(to) : agora;
      const dataInicio = from ? new Date(from) : new Date(agora.getFullYear(), agora.getMonth(), 1);
      const fromStr = dataInicio.toISOString().substring(0, 10);
      const toStr = dataFim.toISOString().substring(0, 10);
      const nomeArquivo = `financeiro_${tipo ?? "completo"}_${fromStr}_a_${toStr}.csv`;
      const csv = await exportarFinanceiro(partnerContext(request), {
        from: dataInicio,
        to: dataFim,
        tipo: (tipo as "resumo" | "completo") ?? "completo",
        status,
        metodo,
      });
      reply.header("Content-Type", "text/csv; charset=utf-8");
      reply.header("Content-Disposition", `attachment; filename="${nomeArquivo}"`);
      return reply.send(csv);
    },
  );
}
