import type { FastifyRequest, FastifyReply } from "fastify";
import type { PartnerContext } from "./context.js";
import { StoreUserRole } from "@vendza/database";
import { forbidden } from "../../lib/http.js";

export function requireRole(...allowed: StoreUserRole[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const ctx = request.partnerContext as PartnerContext | undefined;
    if (!ctx) {
      return reply.code(403).send(forbidden("Contexto de parceiro não resolvido."));
    }
    if (!allowed.includes(ctx.role)) {
      return reply.code(403).send(forbidden("Permissão insuficiente para esta ação."));
    }
  };
}
