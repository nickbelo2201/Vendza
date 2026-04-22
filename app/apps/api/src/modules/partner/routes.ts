import type { FastifyPluginAsync } from "fastify";

import catalogRoutes from "./catalog-routes.js";
import ordersRoutes from "./orders-routes.js";
import crmRoutes from "./crm-routes.js";
import configuracoesRoutes from "./configuracoes-routes.js";
import estoqueRoutes from "./estoque-routes.js";
import financeiroRoutes from "./financeiro-routes.js";
import caixaRoutes from "./caixa-routes.js";
import promocoesRoutes from "./promocoes-routes.js";

/**
 * Orquestrador de rotas partner — registra o hook de autenticação
 * e delega para sub-routers independentes por domínio.
 */
export const partnerRoutes: FastifyPluginAsync = async (app) => {
  // Hook de autenticação herdado por todos os sub-routers
  app.addHook("onRequest", app.authenticate);

  // Sub-routers por domínio
  app.register(catalogRoutes);
  app.register(ordersRoutes);
  app.register(crmRoutes);
  app.register(configuracoesRoutes);
  app.register(estoqueRoutes);
  app.register(financeiroRoutes);
  app.register(caixaRoutes);
  app.register(promocoesRoutes);
};
