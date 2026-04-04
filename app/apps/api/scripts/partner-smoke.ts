import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const ownerEmail = "owner.smoke.20260326101614@vendza.com";
const blockedEmail = "blocked.smoke.20260326101614@vendza.com";
const authPassword = "PartnerSmoke123!";
const smokeSuffix = Date.now().toString(36);

function loadRootEnv() {
  const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../.env");
  const lines = readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function requireEnv(name: string) {
  const value = process.env[name];
  assert.ok(value, `Missing required env: ${name}`);
  return value;
}

async function ensureAuthUser(email: string, password: string) {
  const adminClient = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const authClient = createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const listed = await adminClient.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listed.error) {
    throw listed.error;
  }

  let user = listed.data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase()) ?? null;

  if (!user) {
    const created = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (created.error) {
      throw created.error;
    }
    user = created.data.user;
  }

  const signedIn = await authClient.auth.signInWithPassword({
    email,
    password,
  });
  if (signedIn.error || !signedIn.data.session?.access_token) {
    throw signedIn.error ?? new Error(`Could not sign in smoke user: ${email}`);
  }

  return {
    userId: user.id,
    token: signedIn.data.session.access_token,
  };
}

async function ensureSmokeData(ownerUserId: string, blockedUserId: string) {
  const {
    DeliveryZoneMode,
    OrderChannel,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
    StoreStatus,
    StoreUserRole,
    prisma,
  } = await import("@vendza/database");

  const tenant = await prisma.tenant.upsert({
    where: { slug: "vendza" },
    update: {
      name: "Vendza",
      status: "active",
    },
    create: {
      name: "Vendza",
      slug: "vendza",
      status: "active",
    },
  });

  const store = await prisma.store.upsert({
    where: { slug: "vendza" },
    update: {
      name: "Vendza App",
      status: StoreStatus.open,
      whatsappPhone: "+5511999999999",
      minimumOrderValueCents: 3000,
    },
    create: {
      tenantId: tenant.id,
      name: "Vendza App",
      slug: "vendza",
      status: StoreStatus.open,
      whatsappPhone: "+5511999999999",
      minimumOrderValueCents: 3000,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_email: {
        storeId: store.id,
        email: ownerEmail,
      },
    },
    update: {
      authUserId: ownerUserId,
      name: "INF Owner Smoke",
      role: StoreUserRole.owner,
      isActive: true,
    },
    create: {
      storeId: store.id,
      authUserId: ownerUserId,
      email: ownerEmail,
      name: "INF Owner Smoke",
      role: StoreUserRole.owner,
      isActive: true,
    },
  });

  await prisma.storeUser.upsert({
    where: {
      storeId_email: {
        storeId: store.id,
        email: blockedEmail,
      },
    },
    update: {
      authUserId: blockedUserId,
      name: "INF Blocked Smoke",
      role: StoreUserRole.operator,
      isActive: false,
    },
    create: {
      storeId: store.id,
      authUserId: blockedUserId,
      email: blockedEmail,
      name: "INF Blocked Smoke",
      role: StoreUserRole.operator,
      isActive: false,
    },
  });

  const hiddenStore = await prisma.store.upsert({
    where: { slug: "vendza-hidden-smoke" },
    update: {
      name: "Vendza Hidden Smoke",
      status: StoreStatus.open,
      whatsappPhone: "+5511988888888",
      minimumOrderValueCents: 1000,
    },
    create: {
      tenantId: tenant.id,
      name: "Vendza Hidden Smoke",
      slug: "vendza-hidden-smoke",
      status: StoreStatus.open,
      whatsappPhone: "+5511988888888",
      minimumOrderValueCents: 1000,
    },
  });

  const hiddenCategory = await prisma.category.upsert({
    where: {
      storeId_slug: {
        storeId: hiddenStore.id,
        slug: "hidden-category",
      },
    },
    update: {
      name: "Hidden Category",
    },
    create: {
      storeId: hiddenStore.id,
      name: "Hidden Category",
      slug: "hidden-category",
      sortOrder: 1,
    },
  });

  const hiddenProduct = await prisma.product.upsert({
    where: {
      storeId_slug: {
        storeId: hiddenStore.id,
        slug: "hidden-product",
      },
    },
    update: {
      name: "Produto Oculto Smoke",
      listPriceCents: 1234,
      salePriceCents: 1234,
    },
    create: {
      storeId: hiddenStore.id,
      categoryId: hiddenCategory.id,
      name: "Produto Oculto Smoke",
      slug: "hidden-product",
      description: "Nao pode vazar para outra loja.",
      listPriceCents: 1234,
      salePriceCents: 1234,
      isAvailable: true,
    },
  });

  await prisma.inventoryItem.upsert({
    where: { productId: hiddenProduct.id },
    update: {
      storeId: hiddenStore.id,
      currentStock: 9,
      safetyStock: 1,
    },
    create: {
      storeId: hiddenStore.id,
      productId: hiddenProduct.id,
      currentStock: 9,
      safetyStock: 1,
    },
  });

  const hiddenCustomer = await prisma.customer.upsert({
    where: {
      storeId_phone: {
        storeId: hiddenStore.id,
        phone: "5511977776666",
      },
    },
    update: {
      name: "Cliente Oculto Smoke",
      email: "hidden.customer@vendza.com",
    },
    create: {
      storeId: hiddenStore.id,
      name: "Cliente Oculto Smoke",
      phone: "5511977776666",
      email: "hidden.customer@vendza.com",
    },
  });

  await prisma.deliveryZone.upsert({
    where: {
      id: "0ac1bb11-e2b0-4eef-8962-8dccd7740001",
    },
    update: {
      storeId: hiddenStore.id,
      label: "Hidden Zone",
      deliveryFeeCents: 500,
      estimatedDeliveryMinutes: 20,
    },
    create: {
      id: "0ac1bb11-e2b0-4eef-8962-8dccd7740001",
      storeId: hiddenStore.id,
      label: "Hidden Zone",
      mode: DeliveryZoneMode.neighborhood_radius,
      neighborhoodsJson: ["Hidden"],
      radiusMeters: 2000,
      deliveryFeeCents: 500,
      minimumOrderValueCents: 0,
      estimatedDeliveryMinutes: 20,
      isActive: true,
    },
  });

  const hiddenOrder = await prisma.order.upsert({
    where: {
      storeId_publicId: {
        storeId: hiddenStore.id,
        publicId: "PED-HIDDEN-0001",
      },
    },
    update: {
      customerId: hiddenCustomer.id,
      channel: OrderChannel.manual,
      status: OrderStatus.pending,
      paymentMethod: PaymentMethod.pix,
      paymentStatus: PaymentStatus.pending,
      customerName: hiddenCustomer.name,
      customerPhone: hiddenCustomer.phone,
      customerEmail: hiddenCustomer.email,
      deliveryStreet: "Rua Oculta",
      deliveryNumber: "7",
      deliveryNeighborhood: "Hidden",
      deliveryCity: "Sao Paulo",
      deliveryState: "SP",
      deliveryPostalCode: "01000-000",
      subtotalCents: 1234,
      deliveryFeeCents: 500,
      discountCents: 0,
      totalCents: 1734,
      notes: "Pedido oculto para validacao de vazamento",
    },
    create: {
      storeId: hiddenStore.id,
      customerId: hiddenCustomer.id,
      publicId: "PED-HIDDEN-0001",
      channel: OrderChannel.manual,
      status: OrderStatus.pending,
      paymentMethod: PaymentMethod.pix,
      paymentStatus: PaymentStatus.pending,
      customerName: hiddenCustomer.name,
      customerPhone: hiddenCustomer.phone,
      customerEmail: hiddenCustomer.email,
      deliveryStreet: "Rua Oculta",
      deliveryNumber: "7",
      deliveryNeighborhood: "Hidden",
      deliveryCity: "Sao Paulo",
      deliveryState: "SP",
      deliveryPostalCode: "01000-000",
      subtotalCents: 1234,
      deliveryFeeCents: 500,
      discountCents: 0,
      totalCents: 1734,
      notes: "Pedido oculto para validacao de vazamento",
    },
  });

  await prisma.orderItem.deleteMany({
    where: { orderId: hiddenOrder.id },
  });
  await prisma.orderItem.create({
    data: {
      orderId: hiddenOrder.id,
      productId: hiddenProduct.id,
      productName: hiddenProduct.name,
      quantity: 1,
      unitPriceCents: 1234,
      totalPriceCents: 1234,
    },
  });

  const existingHiddenEvent = await prisma.orderEvent.findFirst({
    where: {
      orderId: hiddenOrder.id,
      type: "order.created",
    },
  });
  if (!existingHiddenEvent) {
    await prisma.orderEvent.create({
      data: {
        orderId: hiddenOrder.id,
        type: "order.created",
        payloadJson: {
          status: OrderStatus.pending,
          label: "Pedido criado",
        },
      },
    });
  }

  return { storeId: store.id };
}

async function requestJson(
  app: { inject: (options: { method: "GET" | "POST" | "PATCH"; url: string; headers?: Record<string, string>; payload?: unknown }) => Promise<{ statusCode: number; body: string }>; },
  options: {
    method: "GET" | "POST" | "PATCH";
    url: string;
    token?: string;
    payload?: unknown;
  },
) {
  const response = await app.inject({
    method: options.method,
    url: options.url,
    headers: options.token
      ? {
          authorization: `Bearer ${options.token}`,
        }
      : undefined,
    payload: options.payload,
  });

  let body: unknown = null;
  if (response.body) {
    body = JSON.parse(response.body);
  }

  return {
    statusCode: response.statusCode,
    body,
  };
}

async function main() {
  loadRootEnv();
  const [{ buildApp }, { prisma }] = await Promise.all([import("../src/app.js"), import("@vendza/database")]);
  const ownerAuth = await ensureAuthUser(ownerEmail, authPassword);
  const blockedAuth = await ensureAuthUser(blockedEmail, authPassword);
  await ensureSmokeData(ownerAuth.userId, blockedAuth.userId);

  const app = buildApp();
  await app.ready();

  try {
    const unauthorized = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/store/settings",
    });
    assert.equal(unauthorized.statusCode, 401);

    const forbidden = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/store/settings",
      token: blockedAuth.token,
    });
    assert.equal(forbidden.statusCode, 403);

    const settingsBefore = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/store/settings",
      token: ownerAuth.token,
    });
    assert.equal(settingsBefore.statusCode, 200);
    assert.equal((settingsBefore.body as any).data.slug, "vendza");

    const patchedSettings = await requestJson(app, {
      method: "PATCH",
      url: "/v1/partner/store/settings",
      token: ownerAuth.token,
      payload: {
        name: `Vendza Smoke ${smokeSuffix}`,
        whatsappPhone: "+5511912345678",
        minimumOrderValueCents: 4500,
      },
    });
    assert.equal(patchedSettings.statusCode, 200);
    assert.equal((patchedSettings.body as any).data.minimumOrderValueCents, 4500);

    const patchedHours = await requestJson(app, {
      method: "PATCH",
      url: "/v1/partner/store/hours",
      token: ownerAuth.token,
      payload: [
        { dayOfWeek: 0, opensAt: "17:00", closesAt: "02:00", isClosed: false },
        { dayOfWeek: 1, opensAt: "17:00", closesAt: "02:00", isClosed: false },
      ],
    });
    assert.equal(patchedHours.statusCode, 200);
    assert.equal(Array.isArray((patchedHours.body as any).data), true);

    const zonesBefore = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/store/delivery-zones",
      token: ownerAuth.token,
    });
    assert.equal(zonesBefore.statusCode, 200);

    const patchedZones = await requestJson(app, {
      method: "PATCH",
      url: "/v1/partner/store/delivery-zones",
      token: ownerAuth.token,
      payload: [
        {
          label: `Centro Smoke ${smokeSuffix}`,
          feeCents: 990,
          etaMinutes: "35",
          neighborhoods: ["Centro", "Bela Vista"],
          radiusKm: 5.5,
        },
      ],
    });
    assert.equal(patchedZones.statusCode, 200);
    assert.equal((patchedZones.body as any).data[0].feeCents, 990);

    const productsBefore = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/products",
      token: ownerAuth.token,
    });
    assert.equal(productsBefore.statusCode, 200);
    assert.equal(
      (productsBefore.body as any).data.some((product: { slug: string }) => product.slug === "hidden-product"),
      false,
    );

    const productSlug = `smoke-product-${smokeSuffix}`;
    const createdProduct = await requestJson(app, {
      method: "POST",
      url: "/v1/partner/products",
      token: ownerAuth.token,
      payload: {
        name: `Produto Smoke ${smokeSuffix}`,
        slug: productSlug,
        listPriceCents: 2199,
        salePriceCents: 1999,
      },
    });
    assert.equal(createdProduct.statusCode, 201);
    const createdProductId = (createdProduct.body as any).data.id as string;
    assert.ok(createdProductId);

    const patchedProduct = await requestJson(app, {
      method: "PATCH",
      url: `/v1/partner/products/${createdProductId}`,
      token: ownerAuth.token,
      payload: {
        name: `Produto Smoke Atualizado ${smokeSuffix}`,
        listPriceCents: 2299,
        salePriceCents: 2099,
      },
    });
    assert.equal(patchedProduct.statusCode, 200);
    assert.equal((patchedProduct.body as any).data.name, `Produto Smoke Atualizado ${smokeSuffix}`);

    const availability = await requestJson(app, {
      method: "PATCH",
      url: `/v1/partner/products/${createdProductId}/availability`,
      token: ownerAuth.token,
      payload: {
        isAvailable: false,
      },
    });
    assert.equal(availability.statusCode, 200);
    assert.equal((availability.body as any).data.isAvailable, false);

    const inventoryBefore = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/inventory",
      token: ownerAuth.token,
    });
    assert.equal(inventoryBefore.statusCode, 200);
    assert.equal(
      (inventoryBefore.body as any).data.some(
        (item: { product: { slug: string } }) => item.product.slug === "hidden-product",
      ),
      false,
    );

    const movementBeforeCount = await prisma.inventoryMovement.count({
      where: {
        storeId: (settingsBefore.body as any).data.id,
      },
    });
    const movement = await requestJson(app, {
      method: "POST",
      url: "/v1/partner/inventory/movements",
      token: ownerAuth.token,
      payload: {
        productId: createdProductId,
        quantityDelta: 7,
        reason: `smoke-${smokeSuffix}`,
      },
    });
    assert.equal(movement.statusCode, 201);
    assert.equal((movement.body as any).data.currentStock, 7);
    const movementAfterCount = await prisma.inventoryMovement.count({
      where: {
        storeId: (settingsBefore.body as any).data.id,
      },
    });
    assert.equal(movementAfterCount, movementBeforeCount + 1);

    const movementRecord = await prisma.inventoryMovement.findFirst({
      where: {
        storeId: (settingsBefore.body as any).data.id,
        reason: `smoke-${smokeSuffix}`,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.ok(movementRecord);
    assert.equal(movementRecord.quantityDelta, 7);

    const ordersBefore = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/orders",
      token: ownerAuth.token,
    });
    assert.equal(ordersBefore.statusCode, 200);
    assert.equal(
      (ordersBefore.body as any).data.some((order: { publicId: string }) => order.publicId === "PED-HIDDEN-0001"),
      false,
    );

    const seedOrder = (ordersBefore.body as any).data.find((order: { publicId: string }) => order.publicId === "PED-0001");
    assert.ok(seedOrder);

    const orderDetail = await requestJson(app, {
      method: "GET",
      url: `/v1/partner/orders/${seedOrder.id}`,
      token: ownerAuth.token,
    });
    assert.equal(orderDetail.statusCode, 200);
    assert.equal((orderDetail.body as any).data.publicId, "PED-0001");

    const eventsBefore = await prisma.orderEvent.count({
      where: {
        orderId: seedOrder.id,
      },
    });
    const patchedStatus = await requestJson(app, {
      method: "PATCH",
      url: `/v1/partner/orders/${seedOrder.id}/status`,
      token: ownerAuth.token,
      payload: {
        status: "confirmed",
        note: `smoke-${smokeSuffix}`,
      },
    });
    assert.equal(patchedStatus.statusCode, 200);
    assert.equal((patchedStatus.body as any).data.status, "confirmed");
    const eventsAfter = await prisma.orderEvent.count({
      where: {
        orderId: seedOrder.id,
      },
    });
    assert.equal(eventsAfter, eventsBefore + 1);

    const latestEvent = await prisma.orderEvent.findFirst({
      where: {
        orderId: seedOrder.id,
        type: "order.status_changed",
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    assert.ok(latestEvent);
    assert.equal((latestEvent.payloadJson as Record<string, unknown>).status, "confirmed");

    const manualOrder = await requestJson(app, {
      method: "POST",
      url: "/v1/partner/orders/manual",
      token: ownerAuth.token,
      payload: {
        customer: {
          name: `Cliente Manual ${smokeSuffix}`,
          phone: `55119${Date.now().toString().slice(-8)}`,
          email: `manual.${smokeSuffix}@vendza.com`,
        },
        items: [
          {
            productId: createdProductId,
            quantity: 2,
          },
        ],
        address: {
          line1: "Rua Manual",
          number: "100",
          neighborhood: "Centro",
          city: "Sao Paulo",
          state: "SP",
        },
        payment: {
          method: "pix",
        },
        note: `manual-smoke-${smokeSuffix}`,
      },
    });
    assert.equal(manualOrder.statusCode, 201);
    const manualOrderId = (manualOrder.body as any).data.id as string;
    assert.ok(manualOrderId);

    const ordersAfter = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/orders",
      token: ownerAuth.token,
    });
    assert.equal(ordersAfter.statusCode, 200);
    assert.equal(
      (ordersAfter.body as any).data.some((order: { id: string }) => order.id === manualOrderId),
      true,
    );

    const customers = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/customers",
      token: ownerAuth.token,
    });
    assert.equal(customers.statusCode, 200);
    assert.equal(
      (customers.body as any).data.some((customer: { email: string | null }) => customer.email === "hidden.customer@vendza.com"),
      false,
    );

    const manualCustomer = (customers.body as any).data.find(
      (customer: { email: string | null }) => customer.email === `manual.${smokeSuffix}@vendza.com`,
    );
    assert.ok(manualCustomer);

    const customerDetail = await requestJson(app, {
      method: "GET",
      url: `/v1/partner/customers/${manualCustomer.id}`,
      token: ownerAuth.token,
    });
    assert.equal(customerDetail.statusCode, 200);

    const patchedCustomer = await requestJson(app, {
      method: "PATCH",
      url: `/v1/partner/customers/${manualCustomer.id}`,
      token: ownerAuth.token,
      payload: {
        name: `Cliente Manual Atualizado ${smokeSuffix}`,
        isInactive: false,
      },
    });
    assert.equal(patchedCustomer.statusCode, 200);
    assert.equal((patchedCustomer.body as any).data.name, `Cliente Manual Atualizado ${smokeSuffix}`);

    const dashboard = await requestJson(app, {
      method: "GET",
      url: "/v1/partner/dashboard/summary",
      token: ownerAuth.token,
    });
    assert.equal(dashboard.statusCode, 200);
    assert.equal(typeof (dashboard.body as any).data.ordersToday, "number");

    console.log("SMOKE_OK");
  } finally {
    await app.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
