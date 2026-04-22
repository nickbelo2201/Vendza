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

/**
 * Converte uma data "YYYY-MM-DD" para o início do dia em Brasília (00:00 BRT = 03:00 UTC).
 * Critério padronizado: "pedido do dia" = criado entre 00:00 e 23:59:59.999 em Brasília.
 */
function inicioDiaBrasilia(dateStr: string): Date {
  return new Date(`${dateStr}T03:00:00.000Z`);
}

/**
 * Converte uma data "YYYY-MM-DD" para o fim do dia em Brasília (23:59:59.999 BRT = 02:59:59.999 UTC do dia seguinte).
 */
function fimDiaBrasilia(dateStr: string): Date {
  return new Date(new Date(`${dateStr}T03:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Retorna a data de hoje no fuso horário de Brasília, formato "YYYY-MM-DD".
 */
function hojeEmBrasilia(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
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
      const hojeStr = hojeEmBrasilia();
      const dataFim = to ? fimDiaBrasilia(to) : fimDiaBrasilia(hojeStr);
      const dataInicio = from ? inicioDiaBrasilia(from) : (() => {
        // Primeiro dia do mês em Brasília
        const [ano, mes] = hojeStr.split("-");
        return inicioDiaBrasilia(`${ano}-${mes}-01`);
      })();
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
      const hojeStr = hojeEmBrasilia();
      const dataFim = to ? fimDiaBrasilia(to) : fimDiaBrasilia(hojeStr);
      const dataInicio = from ? inicioDiaBrasilia(from) : (() => {
        const [ano, mes] = hojeStr.split("-");
        return inicioDiaBrasilia(`${ano}-${mes}-01`);
      })();
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
      const hojeStr = hojeEmBrasilia();
      const dataFim = to ? fimDiaBrasilia(to) : fimDiaBrasilia(hojeStr);
      const dataInicio = from ? inicioDiaBrasilia(from) : (() => {
        const [ano, mes] = hojeStr.split("-");
        return inicioDiaBrasilia(`${ano}-${mes}-01`);
      })();
      const fromStr = from ?? `${hojeStr.split("-")[0]}-${hojeStr.split("-")[1]}-01`;
      const toStr = to ?? hojeStr;
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
