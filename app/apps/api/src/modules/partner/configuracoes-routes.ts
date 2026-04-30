import { Type, type Static } from "@sinclair/typebox";
import type { FastifyInstance, FastifyRequest } from "fastify";

import { envelopeSchema, ok, notFound, badRequest } from "../../lib/http.js";
import {
  convidarUsuario,
  getContaBancaria,
  getLoja,
  listUsuarios,
  revogarUsuario,
  updateLoja,
  upsertContaBancaria,
} from "./configuracoes-service.js";
import {
  createDeliveryZone,
  deleteDeliveryZone,
  listDeliveryZones,
  updateDeliveryZone,
  type DeliveryZoneInput,
} from "./delivery-zones-service.js";
import { getStoreHours, updateStoreHours } from "./store-service.js";
import { type PartnerContext } from "./context.js";
import { requireRole } from "./require-role.js";

// ─── Schemas TypeBox ──────────────────────────────────────────────────────────

// ─── Schemas de resposta ──────────────────────────────────────────────────────

/** Schema de dados da loja */
const LojaResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  slug: Type.String(),
  whatsappPhone: Type.Union([Type.String(), Type.Null()]),
  status: Type.String(),
  minimumOrderValueCents: Type.Integer(),
  logoUrl: Type.Union([Type.String(), Type.Null()]),
  addressStreet: Type.Union([Type.String(), Type.Null()]),
  addressNeighborhood: Type.Union([Type.String(), Type.Null()]),
  addressCity: Type.Union([Type.String(), Type.Null()]),
  addressState: Type.Union([Type.String(), Type.Null()]),
  addressZipCode: Type.Union([Type.String(), Type.Null()]),
  addressComplement: Type.Union([Type.String(), Type.Null()]),
});

/** Schema de horário de funcionamento */
const StoreHourResponseSchema = Type.Object({
  dayOfWeek: Type.Integer(),
  opensAt: Type.String(),
  closesAt: Type.String(),
  isClosed: Type.Boolean(),
});

/** Schema de conta bancária */
const ContaBancariaResponseSchema = Type.Union([
  Type.Object({
    keyType: Type.String(),
    lastFourDigits: Type.String(),
    bankName: Type.Union([Type.String(), Type.Null()]),
  }),
  Type.Null(),
]);

/** Schema de perfil do usuário logado */
const MeResponseSchema = Type.Object({
  userId: Type.String(),
  storeId: Type.String(),
  role: Type.String(),
});

/** Schema de usuário da loja */
const StoreUserResponseSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  role: Type.String(),
  user: Type.Object({
    id: Type.String(),
    name: Type.Union([Type.String(), Type.Null()]),
    email: Type.String(),
  }),
});

/** Schema de convite */
const ConviteResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  role: Type.String(),
  storeId: Type.String(),
  isActive: Type.Boolean(),
  createdAt: Type.Unsafe<Date | string>({}),
});

/** Schema de revogação de usuário */
const RevogarUsuarioResponseSchema = Type.Object({ revoked: Type.Literal(true), userId: Type.String() });

/** Schema de zona de entrega */
const DeliveryZoneResponseSchema = Type.Object({
  id: Type.String(),
  label: Type.String(),
  mode: Type.String(),
  radiusKm: Type.Number(),
  neighborhoods: Type.Array(Type.String()),
  centerLat: Type.Union([Type.Number(), Type.Null()]),
  centerLng: Type.Union([Type.Number(), Type.Null()]),
  feeCents: Type.Integer(),
  etaMinutes: Type.Integer(),
  minimumOrderCents: Type.Integer(),
  freeShippingAboveCents: Type.Integer(),
  isActive: Type.Boolean(),
});

const StoreHourSchema = Type.Object({
  dayOfWeek: Type.Integer({ minimum: 0, maximum: 6 }),
  opensAt: Type.String({ pattern: "^\\d{2}:\\d{2}$" }),
  closesAt: Type.String({ pattern: "^\\d{2}:\\d{2}$" }),
  isClosed: Type.Optional(Type.Boolean()),
});
const StoreHoursBodySchema = Type.Array(StoreHourSchema, { maxItems: 7 });

const DeliveryZoneBodySchema = Type.Object({
  label: Type.String({ minLength: 1 }),
  mode: Type.Union([Type.Literal("radius"), Type.Literal("neighborhoods")]),
  radiusKm: Type.Optional(Type.Number({ minimum: 0 })),
  neighborhoods: Type.Optional(Type.Array(Type.String())),
  centerLat: Type.Optional(Type.Number()),
  centerLng: Type.Optional(Type.Number()),
  feeCents: Type.Integer({ minimum: 0 }),
  etaMinutes: Type.Integer({ minimum: 1 }),
  minimumOrderCents: Type.Optional(Type.Integer({ minimum: 0 })),
  freeShippingAboveCents: Type.Optional(Type.Integer({ minimum: 0 })),
});

const LojaUpdateSchema = Type.Object({
  name: Type.Optional(Type.String({ minLength: 1 })),
  slug: Type.Optional(Type.String({ pattern: "^[a-z0-9-]+$" })),
  whatsappPhone: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([Type.Literal("open"), Type.Literal("closed"), Type.Literal("paused")])),
  minimumOrderValueCents: Type.Optional(Type.Integer({ minimum: 0 })),
  logoUrl: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  addressStreet: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  addressNeighborhood: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  addressCity: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  addressState: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  addressZipCode: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  addressComplement: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

/** Schema de URL assinada para upload de logo */
const LogoSignedUrlResponseSchema = Type.Object({
  signedUrl: Type.String(),
  token: Type.String(),
  path: Type.String(),
  publicUrl: Type.String(),
});

const ContaBancariaUpdateSchema = Type.Object({
  keyType: Type.Union([
    Type.Literal("cpf"),
    Type.Literal("cnpj"),
    Type.Literal("telefone"),
    Type.Literal("email"),
    Type.Literal("aleatoria"),
  ]),
  pixKey: Type.String({ minLength: 1 }),
  bankName: Type.Optional(Type.String()),
});

const ConviteSchema = Type.Object({
  email: Type.String({ format: "email" }),
  role: Type.Union([Type.Literal("manager"), Type.Literal("operator")]),
});

type LojaUpdateBody = Static<typeof LojaUpdateSchema>;
type ContaBancariaUpdateBody = Static<typeof ContaBancariaUpdateSchema>;
type ConviteBody = Static<typeof ConviteSchema>;
type StoreHourBody = Static<typeof StoreHourSchema>;
type DeliveryZoneBody = Static<typeof DeliveryZoneBodySchema>;
type LogoSignedUrlBody = { ext: string };

export type { LojaUpdateBody };

function partnerContext(request: FastifyRequest) {
  if (!request.partnerContext) {
    throw new Error("Partner context not resolved.");
  }
  return request.partnerContext as PartnerContext;
}

// ─── Plugin Fastify ───────────────────────────────────────────────────────────

export default async function configuracoesRoutes(app: FastifyInstance) {
  // ─── Dados da loja ────────────────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/loja",
    { schema: { response: { 200: envelopeSchema(LojaResponseSchema) } } },
    async (request) => ok(await getLoja(partnerContext(request))),
  );

  app.put<{ Body: LojaUpdateBody }>(
    "/partner/configuracoes/loja",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        body: LojaUpdateSchema,
        response: { 200: envelopeSchema(LojaResponseSchema) },
      },
    },
    async (request) => ok(await updateLoja(partnerContext(request), request.body)),
  );

  // ─── Horários ─────────────────────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/horarios",
    { schema: { response: { 200: envelopeSchema(Type.Array(StoreHourResponseSchema)) } } },
    async (request) => ok(await getStoreHours(partnerContext(request))),
  );

  app.put<{ Body: StoreHourBody[] }>(
    "/partner/configuracoes/horarios",
    {
      preHandler: requireRole("owner", "manager"),
      schema: { body: StoreHoursBodySchema, response: { 200: envelopeSchema(Type.Array(StoreHourResponseSchema)) } },
    },
    async (request) => ok(await updateStoreHours(partnerContext(request), request.body)),
  );

  // ─── Conta bancária ───────────────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/conta-bancaria",
    { schema: { response: { 200: envelopeSchema(ContaBancariaResponseSchema) } } },
    async (request) => ok(await getContaBancaria(partnerContext(request))),
  );

  app.put<{ Body: ContaBancariaUpdateBody }>(
    "/partner/configuracoes/conta-bancaria",
    {
      preHandler: requireRole("owner"),
      schema: {
        body: ContaBancariaUpdateSchema,
        response: { 200: envelopeSchema(ContaBancariaResponseSchema) },
      },
    },
    async (request) => ok(await upsertContaBancaria(partnerContext(request), request.body)),
  );

  // ─── Perfil do usuário autenticado ────────────────────────────────────────

  app.get(
    "/partner/me",
    { schema: { response: { 200: envelopeSchema(MeResponseSchema) } } },
    async (request) => {
      const ctx = partnerContext(request);
      return ok({ userId: ctx.storeUserId, storeId: ctx.storeId, role: ctx.role });
    },
  );

  // ─── Usuários da loja ─────────────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/usuarios",
    { schema: { response: { 200: envelopeSchema(Type.Array(StoreUserResponseSchema)) } } },
    async (request) => ok(await listUsuarios(partnerContext(request))),
  );

  app.post<{ Body: ConviteBody }>(
    "/partner/configuracoes/usuarios/convidar",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        body: ConviteSchema,
        response: { 201: envelopeSchema(ConviteResponseSchema) },
      },
    },
    async (request, reply) => {
      const dados = await convidarUsuario(
        partnerContext(request),
        request.body,
        app.supabaseAdmin,
        app.log,
      );
      reply.code(201);
      return ok(dados);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/configuracoes/usuarios/:id",
    {
      preHandler: requireRole("owner"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(RevogarUsuarioResponseSchema) },
      },
    },
    async (request, reply) => {
      const resultado = await revogarUsuario(partnerContext(request), request.params.id);
      if (!resultado) {
        return reply.code(400).send(badRequest("Nao foi possivel revogar o usuario."));
      }
      return ok(resultado);
    },
  );

  // ─── Zonas de entrega ─────────────────────────────────────────────────────

  app.get(
    "/partner/configuracoes/zonas-entrega",
    { schema: { response: { 200: envelopeSchema(Type.Array(DeliveryZoneResponseSchema)) } } },
    async (request) => ok(await listDeliveryZones(partnerContext(request))),
  );

  app.post<{ Body: DeliveryZoneBody }>(
    "/partner/configuracoes/zonas-entrega",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        body: DeliveryZoneBodySchema,
        response: { 201: envelopeSchema(DeliveryZoneResponseSchema) },
      },
    },
    async (request, reply) => {
      reply.code(201);
      const input: DeliveryZoneInput = {
        label: request.body.label,
        mode: request.body.mode,
        radiusKm: request.body.radiusKm,
        neighborhoods: request.body.neighborhoods,
        centerLat: request.body.centerLat,
        centerLng: request.body.centerLng,
        feeCents: request.body.feeCents,
        etaMinutes: request.body.etaMinutes,
        minimumOrderCents: request.body.minimumOrderCents,
        freeShippingAboveCents: request.body.freeShippingAboveCents,
      };
      return ok(await createDeliveryZone(partnerContext(request), input));
    },
  );

  app.put<{ Params: { id: string }; Body: Partial<DeliveryZoneBody> }>(
    "/partner/configuracoes/zonas-entrega/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        body: Type.Partial(DeliveryZoneBodySchema),
        response: { 200: envelopeSchema(DeliveryZoneResponseSchema) },
      },
    },
    async (request, reply) => {
      const zona = await updateDeliveryZone(partnerContext(request), request.params.id, request.body as Partial<DeliveryZoneInput>);
      if (!zona) {
        return reply.code(404).send(notFound("Zona de entrega nao encontrada."));
      }
      return ok(zona);
    },
  );

  app.delete<{ Params: { id: string } }>(
    "/partner/configuracoes/zonas-entrega/:id",
    {
      preHandler: requireRole("owner", "manager"),
      schema: {
        params: Type.Object({ id: Type.String() }),
        response: { 200: envelopeSchema(DeliveryZoneResponseSchema) },
      },
    },
    async (request, reply) => {
      const zona = await deleteDeliveryZone(partnerContext(request), request.params.id);
      if (!zona) {
        return reply.code(404).send(notFound("Zona de entrega nao encontrada."));
      }
      return ok(zona);
    },
  );

  // ─── Upload de logo da loja (signed URL) ──────────────────────────────────

  app.post<{ Body: LogoSignedUrlBody }>(
    "/partner/upload/logo-signed-url",
    {
      schema: {
        body: Type.Object({
          ext: Type.String(),
        }),
        response: { 200: envelopeSchema(LogoSignedUrlResponseSchema) },
      },
    },
    async (request, reply) => {
      const { ext } = request.body;
      const context = partnerContext(request);

      // Validar ext contra allowlist
      const EXT_ALLOWLIST = ["jpg", "jpeg", "png", "webp", "svg"];
      const extNormalizada = ext.replace(/^\./, "").toLowerCase();
      if (!EXT_ALLOWLIST.includes(extNormalizada)) {
        return reply.code(400).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "INVALID_EXT", message: `Extensão não permitida. Use: ${EXT_ALLOWLIST.join(", ")}.` },
        });
      }

      // Path fixo por loja — sobrescreve sempre (cada loja tem uma única logo)
      const path = `logos/store-${context.storeId}.${extNormalizada}`;

      const { data, error } = await app.supabaseAdmin.storage
        .from("product-images")
        .createSignedUploadUrl(path, { upsert: true });

      if (error || !data) {
        return reply.code(500).send({
          data: null,
          meta: { requestedAt: new Date().toISOString(), stub: false },
          error: { code: "UPLOAD_ERROR", message: error?.message ?? "Erro ao gerar URL de upload." },
        });
      }

      const { data: { publicUrl } } = app.supabaseAdmin.storage
        .from("product-images")
        .getPublicUrl(path);

      return ok({ signedUrl: data.signedUrl, token: data.token, path, publicUrl });
    },
  );
}
