import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";

import { authenticatePartnerRequest } from "../modules/partner/auth.js";
import type { PartnerContext } from "../modules/partner/context.js";

declare module "fastify" {
  interface FastifyInstance {
    supabase: SupabaseClient;
    supabaseAdmin: SupabaseClient;
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    user: User | null;
    partnerContext: PartnerContext | null;
  }
}

const BUCKET_NAME = "product-images";

export const supabasePlugin = fp(async (fastify) => {
  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!supabaseUrl || !supabaseKey) {
    fastify.log.warn("Missing SUPABASE_URL or SUPABASE_ANON_KEY env variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  fastify.decorate("supabase", supabase);
  fastify.decorate("supabaseAdmin", supabaseAdmin);

  // Garante que o bucket de imagens de produto existe
  if (supabaseServiceKey) {
    supabaseAdmin.storage.getBucket(BUCKET_NAME).then(({ error }) => {
      if (error) {
        supabaseAdmin.storage
          .createBucket(BUCKET_NAME, { public: true, allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"], fileSizeLimit: 10485760 })
          .then(({ error: createErr }) => {
            if (createErr && !createErr.message.includes("already exists")) {
              fastify.log.error(`Falha ao criar bucket ${BUCKET_NAME}: ${createErr.message}`);
            } else {
              fastify.log.info(`Bucket ${BUCKET_NAME} criado com sucesso.`);
            }
          });
      }
    });
  }

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
