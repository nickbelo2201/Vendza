import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { authenticatePartnerRequest } from "../modules/partner/auth.js";
import type { PartnerContext } from "../modules/partner/context.js";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: User | null;
    partnerContext: PartnerContext | null;
  }
}

export const supabasePlugin = fp(async (fastify) => {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    fastify.log.warn("Missing SUPABASE_URL or SUPABASE_ANON_KEY env variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  fastify.decorate("supabase", supabase);

  fastify.decorate("authenticate", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const ok = await authenticatePartnerRequest(request, reply, supabase);
      if (!ok) {
        return;
      }
    } catch (err: unknown) {
      fastify.log.error(err);
      return reply.status(401).send({
        data: null,
        meta: { requestedAt: new Date().toISOString(), stub: false },
        error: { code: "UNAUTHORIZED", message: "Authentication failed." },
      });
    }
  });
});
