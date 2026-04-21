import { prisma } from "@vendza/database";
import { applyTemplatesToStore } from "./apps/api/src/modules/onboarding/service.js";

async function main() {
  console.log("🚀 Criando loja demo com templates Mercado + Adega...\n");

  try {
    // 1. Pegar user já existente
    const storeUser = await prisma.storeUser.findFirst({
      where: { email: "nickbelo2201@gmail.com" },
    });

    if (!storeUser) {
      console.error("❌ Usuário não encontrado");
      return;
    }

    // 2. Criar Tenant + Store (ou usar existente)
    const tenant = await prisma.tenant.upsert({
      where: { slug: "demo-adega-mercado" },
      update: { name: "Demo Adega + Mercado" },
      create: {
        name: "Demo Adega + Mercado",
        slug: "demo-adega-mercado",
      },
    });

    const store = await prisma.store.upsert({
      where: { slug: "demo-adega-mercado" },
      update: { whatsappPhone: "5511987654321" },
      create: {
        tenantId: tenant.id,
        name: "Demo Adega + Mercado",
        slug: "demo-adega-mercado",
        whatsappPhone: "5511987654321",
        status: "open",
      },
    });

    console.log(`✅ Store criada: ${store.name} (${store.slug})`);

    // 3. Aplicar templates Mercado + Adega
    console.log("📦 Aplicando templates: adega, mercado...");

    // Importar dynamicamente para evitar dependência circular
    const { applyTemplatesToStore } = await import(
      "./apps/api/src/modules/onboarding/service.js"
    );

    const result = await applyTemplatesToStore(store.id, ["adega", "mercado"]);

    console.log(`✅ ${result.appliedCategories} categorias criadas!`);

    // 4. Criar ou atualizar StoreUser para o dono
    await prisma.storeUser.upsert({
      where: { storeId_email: { storeId: store.id, email: storeUser.email } },
      update: { role: "owner" },
      create: {
        storeId: store.id,
        authUserId: storeUser.authUserId,
        email: storeUser.email,
        name: storeUser.name,
        role: "owner",
      },
    });

    console.log("✅ StoreUser criado\n");
    console.log(`🎉 Loja demo pronta para testar!\n`);
    console.log(`   URL: http://localhost:3001/?store=demo-adega-mercado`);
    console.log(`   Categorias: Adega (7) + Mercado (10)`);

  } catch (err: any) {
    console.error("❌ Erro:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
