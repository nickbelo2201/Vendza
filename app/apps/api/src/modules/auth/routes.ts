import { Type, type Static } from "@sinclair/typebox";
import type { FastifyPluginAsync } from "fastify";

import { envelopeSchema, ok } from "../../lib/http.js";
import { getStoreSettings } from "../../lib/mock-data.js";

const LoginBodySchema = Type.Object({
  email: Type.String({ format: "email" }),
  password: Type.String({ minLength: 6 })
});

const RefreshBodySchema = Type.Object({
  refreshToken: Type.String({ minLength: 10 })
});

type LoginBody = Static<typeof LoginBodySchema>;
type RefreshBody = Static<typeof RefreshBodySchema>;

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post<{ Body: LoginBody }>(
    "/auth/login",
    {
      schema: {
        body: LoginBodySchema,
        response: { 200: envelopeSchema(Type.Any()) }
      }
    },
    async ({ body }) =>
      ok({
        accessToken: `access-${body.email}`,
        refreshToken: `refresh-${body.email}`,
        user: {
          id: "user-owner",
          email: body.email,
          role: "owner"
        },
        store: getStoreSettings()
      })
  );

  app.post<{ Body: RefreshBody }>(
    "/auth/refresh",
    {
      schema: {
        body: RefreshBodySchema,
        response: { 200: envelopeSchema(Type.Any()) }
      }
    },
    async ({ body }) =>
      ok({
        accessToken: `renewed-${body.refreshToken.slice(0, 12)}`
      })
  );
};
