import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import type { FastifyReply, FastifyRequest } from "fastify";

import { resolvePartnerContext, type PartnerContext } from "./context.js";

type PartnerAuthRequest = FastifyRequest & {
  user?: User | null;
  partnerContext?: PartnerContext | null;
};

let cachedSupabaseClient: SupabaseClient | null = null;

function getSupabaseClient() {
  if (cachedSupabaseClient) {
    return cachedSupabaseClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL || "";
  const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

  cachedSupabaseClient = createClient(supabaseUrl, supabaseKey);
  return cachedSupabaseClient;
}

function sendAuthError(reply: FastifyReply, statusCode: 401 | 403, message: string) {
  return reply.code(statusCode).send({
    data: null,
    meta: {
      requestedAt: new Date().toISOString(),
      stub: false,
    },
    error: {
      code: statusCode === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
      message,
    },
  });
}

export async function authenticatePartnerRequest(
  request: PartnerAuthRequest,
  reply: FastifyReply,
  supabaseClient: SupabaseClient = getSupabaseClient(),
) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    await sendAuthError(reply, 401, "Bearer token required for partner routes.");
    return false;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const { data, error } = await supabaseClient.auth.getUser(token);

  if (error || !data.user) {
    await sendAuthError(reply, 401, "Invalid bearer token for partner routes.");
    return false;
  }

  const partnerContext = await resolvePartnerContext(data.user.id);

  if (!partnerContext) {
    await sendAuthError(reply, 403, "User does not have an active store binding.");
    return false;
  }

  request.user = data.user;
  request.partnerContext = partnerContext;
  return true;
}
