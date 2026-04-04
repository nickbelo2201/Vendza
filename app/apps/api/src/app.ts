import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import Fastify from "fastify";

import { authRoutes } from "./modules/auth/routes.js";
import { coverageRoutes } from "./modules/coverage/routes.js";
import {
  createInventoryMovement,
  createPartnerProduct,
  getInventory,
  listPartnerProducts,
  updatePartnerProduct,
  updateProductAvailability,
} from "./modules/partner/catalog-service.js";
import {
  getDeliveryZones,
  getStoreSettings,
  updateDeliveryZones,
  updateStoreHours,
  updateStoreSettings,
} from "./modules/partner/store-service.js";
import {
  createManualPartnerOrder,
  getPartnerOrderById,
  listPartnerOrders,
  updatePartnerOrderStatus,
} from "./modules/partner/orders-service.js";
import {
  getCustomerById,
  getDashboardSummary,
  listCustomers,
  updateCustomer,
} from "./modules/partner/crm-dashboard-service.js";
import { storefrontRoutes } from "./modules/storefront/routes.js";
import { supabasePlugin } from "./plugins/supabase.js";
import { socketPlugin } from "./plugins/socketio.js";
import { redisPlugin_ } from "./plugins/redis.js";
import { initQueues } from "./jobs/queues.js";
import { ok } from "./lib/http.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(supabasePlugin);
  app.register(socketPlugin);
  app.register(redisPlugin_);

  app.addHook("onReady", async () => {
    initQueues();
  });

  app.register(cors, {
    origin: true,
    credentials: true
  });

  app.register(sensible);

  app.get("/health", async () => ({
    data: {
      status: "ok",
      service: "vendza-api",
      socket: "active",
    },
    meta: {
      requestedAt: new Date().toISOString(),
      stub: false
    },
    error: null
  }));

  app.register(
    async (v1) => {
      v1.register(coverageRoutes);
      v1.register(storefrontRoutes);
      v1.register(authRoutes);
      v1.register(
        async (partner) => {
          partner.addHook("onRequest", app.authenticate);

          partner.get("/dashboard/summary", async (request) =>
            ok(await getDashboardSummary(request.partnerContext!), { stub: true }),
          );

          partner.get("/orders", async (request) => ok(await listPartnerOrders(request.partnerContext!), { stub: true }));

          partner.get("/orders/:id", async (request, reply) => {
            const params = request.params as { id: string };
            const order = await getPartnerOrderById(request.partnerContext!, params.id);

            if (!order) {
              return reply.code(404).send(ok({ message: "Pedido nao encontrado." }, { stub: true }));
            }

            return ok(order, { stub: true });
          });

          partner.patch("/orders/:id/status", async (request, reply) => {
            const params = request.params as { id: string };
            const body = request.body as { status: "pending" | "confirmed" | "preparing" | "ready_for_delivery" | "out_for_delivery" | "delivered" | "cancelled"; note?: string };
            const order = await updatePartnerOrderStatus(request.partnerContext!, params.id, body);

            if (!order) {
              return reply.code(404).send(ok({ message: "Pedido nao encontrado." }, { stub: true }));
            }

            return ok(order, { stub: true });
          });

          partner.post("/orders/manual", async (request, reply) => {
            const body = request.body as {
              customer: { name: string; phone: string; email?: string };
              items: Array<{ productId: string; quantity: number }>;
              address: { line1: string; number?: string; neighborhood: string; city: string; state: string };
              payment: { method: "pix" | "cash" | "card_online" | "card_on_delivery" };
              note?: string;
            };
            const order = await createManualPartnerOrder(request.partnerContext!, body);

            if (!order) {
              return reply.code(404).send(ok({ message: "Pedido nao encontrado." }, { stub: true }));
            }

            reply.code(201);
            return ok(order, { stub: true });
          });

          partner.get("/products", async (request) => ok(await listPartnerProducts(request.partnerContext!), { stub: true }));

          partner.post("/products", async (request, reply) => {
            const body = request.body as {
              name: string;
              slug: string;
              categoryId?: string;
              listPriceCents: number;
              salePriceCents?: number;
            };
            reply.code(201);
            return ok(await createPartnerProduct(request.partnerContext!, body), { stub: true });
          });

          partner.patch("/products/:id", async (request, reply) => {
            const params = request.params as { id: string };
            const body = request.body as {
              name?: string;
              slug?: string;
              categoryId?: string;
              listPriceCents?: number;
              salePriceCents?: number;
              description?: string;
              imageUrl?: string | null;
              isFeatured?: boolean;
            };
            const product = await updatePartnerProduct(request.partnerContext!, params.id, body);

            if (!product) {
              return reply.code(404).send(ok({ message: "Produto nao encontrado." }, { stub: true }));
            }

            return ok(product, { stub: true });
          });

          partner.patch("/products/:id/availability", async (request, reply) => {
            const params = request.params as { id: string };
            const body = request.body as { isAvailable: boolean };
            const product = await updateProductAvailability(request.partnerContext!, params.id, body.isAvailable);

            if (!product) {
              return reply.code(404).send(ok({ message: "Produto nao encontrado." }, { stub: true }));
            }

            return ok(product, { stub: true });
          });

          partner.get("/inventory", async (request) => ok(await getInventory(request.partnerContext!), { stub: true }));

          partner.post("/inventory/movements", async (request, reply) => {
            const body = request.body as { productId: string; quantityDelta: number; reason: string };
            const movement = await createInventoryMovement(request.partnerContext!, body);

            if (!movement) {
              return reply.code(404).send(ok({ message: "Item de estoque nao encontrado." }, { stub: true }));
            }

            reply.code(201);
            return ok(movement, { stub: true });
          });

          partner.get("/customers", async (request) => ok(await listCustomers(request.partnerContext!), { stub: true }));

          partner.get("/customers/:id", async (request, reply) => {
            const params = request.params as { id: string };
            const customer = await getCustomerById(request.partnerContext!, params.id);

            if (!customer) {
              return reply.code(404).send(ok({ message: "Cliente nao encontrado." }, { stub: true }));
            }

            return ok(customer, { stub: true });
          });

          partner.patch("/customers/:id", async (request, reply) => {
            const params = request.params as { id: string };
            const body = request.body as { name?: string; isInactive?: boolean };
            const customer = await updateCustomer(request.partnerContext!, params.id, body);

            if (!customer) {
              return reply.code(404).send(ok({ message: "Cliente nao encontrado." }, { stub: true }));
            }

            return ok(customer, { stub: true });
          });

          partner.get("/store/settings", async (request) => ok(await getStoreSettings(request.partnerContext!), { stub: true }));

          partner.patch("/store/settings", async (request) => {
            const body = request.body as { name?: string; whatsappPhone?: string; minimumOrderValueCents?: number };
            return ok(await updateStoreSettings(request.partnerContext!, body), { stub: true });
          });

          partner.patch("/store/hours", async (request) => {
            const body = request.body as Array<{ dayOfWeek?: number; weekday?: number; opensAt: string; closesAt: string; isClosed?: boolean }>;
            return ok(await updateStoreHours(request.partnerContext!, body), { stub: true });
          });

          partner.get("/store/delivery-zones", async (request) =>
            ok(await getDeliveryZones(request.partnerContext!), { stub: true }),
          );

          partner.patch("/store/delivery-zones", async (request) => {
            const body = request.body as Array<{
              id?: string;
              label: string;
              feeCents: number;
              etaMinutes: string;
              neighborhoods: string[];
              radiusKm: number;
              isActive?: boolean;
              minimumOrderValueCents?: number;
            }>;
            return ok(await updateDeliveryZones(request.partnerContext!, body), { stub: true });
          });
        },
        { prefix: "/partner" },
      );
    },
    { prefix: "/v1" }
  );

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);

    const errorLike =
      typeof error === "object" && error !== null ? (error as Record<string, unknown>) : null;

    const statusCode = typeof errorLike?.statusCode === "number" ? errorLike.statusCode : 500;
    const errorCode = typeof errorLike?.code === "string" ? errorLike.code : "INTERNAL_SERVER_ERROR";
    const message = error instanceof Error ? error.message : "Unexpected application error.";

    reply.status(statusCode).send({
      data: null,
      meta: {
        requestedAt: new Date().toISOString(),
        stub: false
      },
      error: {
        code: errorCode,
        message
      }
    });
  });

  return app;
}
