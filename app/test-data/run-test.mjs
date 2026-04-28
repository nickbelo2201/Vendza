// Test E2E para NFe import + criação de combo de Natal
import fs from "node:fs";
import path from "node:path";

const API = "https://vendza-production.up.railway.app";
const SUPABASE_URL = "https://lpjjpvwlwvzlmjyedkfd.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwampwdndsd3Z6bG1qeWVka2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NzY4NjksImV4cCI6MjA5MDA1Mjg2OX0.nAZpQdCrIT8nJoSaf1JkZmK_hvDQcgAhDATAf8DudwQ";

async function main() {
  // 1. Login
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: "nickbelo2201@gmail.com", password: "teste1234" }),
  });
  const loginJson = await loginRes.json();
  const jwt = loginJson.access_token;
  if (!jwt) {
    console.error("Login failed:", loginJson);
    process.exit(1);
  }
  console.log("[OK] Login. user.id =", loginJson.user.id);

  const auth = { "Authorization": `Bearer ${jwt}`, "Content-Type": "application/json" };

  // 2. Import NFe
  const xmlPath = path.resolve("nfe-cervejas-natal.xml");
  const xmlContent = fs.readFileSync(xmlPath, "utf-8");
  console.log(`[INFO] XML path: ${xmlPath}`);
  console.log(`[INFO] XML size: ${xmlContent.length} chars / ${fs.statSync(xmlPath).size} bytes`);

  console.log("\n=== STEP 1: NFE IMPORT ===");
  const nfeRes = await fetch(`${API}/v1/partner/nfe/import`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ xmlContent }),
  });
  const nfeJson = await nfeRes.json();
  console.log("Status:", nfeRes.status);
  console.log("Response:", JSON.stringify(nfeJson, null, 2));

  // 3. Listar produtos atuais e localizar/criar Whisky e Água de Coco
  console.log("\n=== STEP 2: SETUP COMBO INGREDIENTS ===");
  const findProduct = async (busca) => {
    const r = await fetch(`${API}/v1/partner/products?busca=${encodeURIComponent(busca)}&limite=10`, { headers: auth });
    const j = await r.json();
    return j.data?.produtos ?? [];
  };

  let whiskyProd = (await findProduct("red label")).find((p) => /red label/i.test(p.name));
  if (!whiskyProd) {
    console.log("[INFO] Whisky Red Label não encontrado, criando...");
    const r = await fetch(`${API}/v1/partner/products`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        name: "Whisky Johnnie Walker Red Label 750ml",
        slug: `whisky-red-label-${Date.now()}`,
        listPriceCents: 8990,
        isAvailable: true,
      }),
    });
    const j = await r.json();
    if (!r.ok) { console.error("Falha criar whisky:", j); process.exit(1); }
    whiskyProd = j.data;
  }
  console.log("[OK] Whisky:", whiskyProd.id, whiskyProd.name);

  let aguaCocoProd = (await findProduct("agua de coco")).find((p) => /coco/i.test(p.name));
  if (!aguaCocoProd) {
    console.log("[INFO] Água de Coco não encontrada, criando...");
    const r = await fetch(`${API}/v1/partner/products`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        name: "Água de Coco Kero Coco 1L",
        slug: `agua-coco-${Date.now()}`,
        listPriceCents: 990,
        isAvailable: true,
      }),
    });
    const j = await r.json();
    if (!r.ok) { console.error("Falha criar agua coco:", j); process.exit(1); }
    aguaCocoProd = j.data;
  }
  console.log("[OK] Água de Coco:", aguaCocoProd.id, aguaCocoProd.name);

  // 4. Criar grupo de complementos "Energético"
  console.log("\n=== STEP 3: CREATE COMPLEMENT GROUP 'Energético' ===");
  const groupRes = await fetch(`${API}/v1/partner/complement-groups`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      name: "Energético (escolha 1)",
      description: "Selecione um energético para o seu combo de Natal.",
      minSelection: 1,
      maxSelection: 1,
      isRequired: true,
      isActive: true,
    }),
  });
  const groupJson = await groupRes.json();
  console.log("Status:", groupRes.status);
  console.log("Response:", JSON.stringify(groupJson, null, 2));
  if (!groupRes.ok) { process.exit(1); }
  const groupId = groupJson.data.id;

  // 5. Criar 3 complementos: Red Bull, Monster, TNT
  console.log("\n=== STEP 4: CREATE COMPLEMENTS ===");
  const complementInputs = [
    { name: "Red Bull Energy Drink 250ml", additionalPriceCents: 990 },
    { name: "Monster Energy 473ml", additionalPriceCents: 1190 },
    { name: "TNT Energy Drink 269ml", additionalPriceCents: 590 },
  ];
  const createdComplements = [];
  for (const c of complementInputs) {
    const r = await fetch(`${API}/v1/partner/complements`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({
        complementGroupId: groupId,
        name: c.name,
        additionalPriceCents: c.additionalPriceCents,
        isAvailable: true,
      }),
    });
    const j = await r.json();
    console.log(`  ${c.name}: status=${r.status} id=${j.data?.id ?? "ERR"}`);
    if (!r.ok) { console.error(j); process.exit(1); }
    createdComplements.push(j.data);
  }

  // 6. Criar combo de Natal
  console.log("\n=== STEP 5: CREATE COMBO ===");
  const slug = `combo-natal-adega-${Date.now()}`;
  const comboRes = await fetch(`${API}/v1/partner/combos`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({
      name: "Combo Natal Adega — Whisky + Energético + Água de Coco",
      slug,
      description: "Edição limitada de Natal: Whisky Johnnie Walker Red Label 750ml, 1 energético à sua escolha (Red Bull, Monster ou TNT) e 1 Água de Coco gelada para refrescar a ceia. Perfeito para presentear ou brindar com a família.",
      priceCents: 8990,
      isActive: true,
      items: [
        { productId: whiskyProd.id, quantity: 1 },
        { productId: aguaCocoProd.id, quantity: 1 },
      ],
    }),
  });
  const comboJson = await comboRes.json();
  console.log("Status:", comboRes.status);
  console.log("Response:", JSON.stringify(comboJson, null, 2));
  if (!comboRes.ok) { process.exit(1); }
  const comboId = comboJson.data.id;

  // 7. GET combo (lista) e validar
  console.log("\n=== STEP 6: VERIFY COMBO via GET ===");
  const listRes = await fetch(`${API}/v1/partner/combos`, { headers: auth });
  const listJson = await listRes.json();
  const created = listJson.data.find((c) => c.id === comboId);
  console.log("Combo encontrado:", JSON.stringify(created, null, 2));

  // 8. Listar grupo + complementos
  console.log("\n=== STEP 7: VERIFY COMPLEMENT GROUP via GET ===");
  const cgRes = await fetch(`${API}/v1/partner/complement-groups`, { headers: auth });
  const cgJson = await cgRes.json();
  const myGroup = cgJson.data.find((g) => g.id === groupId);
  console.log("Group:", JSON.stringify(myGroup, null, 2));

  const cmpRes = await fetch(`${API}/v1/partner/complements?groupId=${groupId}`, { headers: auth });
  const cmpJson = await cmpRes.json();
  console.log("Complementos do grupo:", JSON.stringify(cmpJson.data, null, 2));

  // 9. Resumo final
  console.log("\n\n=== RESUMO FINAL ===");
  console.log(JSON.stringify({
    xmlPath,
    xmlBytes: fs.statSync(xmlPath).size,
    nfeImport: nfeJson.data,
    nfeImportErrors: nfeJson.error,
    whiskyProductId: whiskyProd.id,
    aguaCocoProductId: aguaCocoProd.id,
    complementGroupId: groupId,
    complementIds: createdComplements.map((c) => ({ id: c.id, name: c.name })),
    comboId,
    comboSlug: slug,
  }, null, 2));
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});
