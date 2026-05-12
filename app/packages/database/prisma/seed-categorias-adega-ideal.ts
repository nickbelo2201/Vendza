import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { config } from "dotenv";

import { prisma } from "../src/index.js";

function resolveEnvPath() {
  let currentDir = dirname(fileURLToPath(import.meta.url));
  for (let depth = 0; depth < 8; depth += 1) {
    const candidate = resolve(currentDir, ".env");
    if (existsSync(candidate)) return candidate;
    const parentDir = resolve(currentDir, "..");
    if (parentDir === currentDir) break;
    currentDir = parentDir;
  }
  return null;
}

const envPath = resolveEnvPath();
if (envPath) config({ path: envPath });

const STORE_SLUG = "adega";

type SubcategoriaInput = { name: string; slug: string };
type CategoriaInput = {
  name: string;
  slug: string;
  sortOrder: number;
  subcategorias: SubcategoriaInput[];
};

const TEMPLATE: CategoriaInput[] = [
  {
    name: "Cervejas",
    slug: "cervejas",
    sortOrder: 1,
    subcategorias: [
      { name: "Cervejas Artesanais", slug: "cervejas-artesanais" },
      { name: "Cervejas Nacionais", slug: "cervejas-nacionais" },
      { name: "Cervejas Importadas", slug: "cervejas-importadas" },
      { name: "Cervejas Sem Álcool", slug: "cervejas-sem-alcool" },
      { name: "Chopes e Growlers", slug: "chopes-e-growlers" },
      { name: "Pacotes e Fardos", slug: "pacotes-e-fardos" },
    ],
  },
  {
    name: "Vinhos",
    slug: "vinhos",
    sortOrder: 2,
    subcategorias: [
      { name: "Vinhos Tintos", slug: "vinhos-tintos" },
      { name: "Vinhos Brancos", slug: "vinhos-brancos" },
      { name: "Vinhos Rosés", slug: "vinhos-roses" },
      { name: "Espumantes e Champagnes", slug: "espumantes-e-champagnes" },
      { name: "Porto e Sobremesa", slug: "porto-e-sobremesa" },
      { name: "Bag-in-Box", slug: "bag-in-box" },
    ],
  },
  {
    name: "Destilados",
    slug: "destilados",
    sortOrder: 3,
    subcategorias: [
      { name: "Whisky", slug: "whisky" },
      { name: "Vodka", slug: "vodka" },
      { name: "Gin", slug: "gin" },
      { name: "Rum e Cachaça", slug: "rum-e-cachaca" },
      { name: "Tequila e Mezcal", slug: "tequila-e-mezcal" },
      { name: "Conhaque e Brandy", slug: "conhaque-e-brandy" },
      { name: "Licores e Amaros", slug: "licores-e-amaros" },
    ],
  },
  {
    name: "Drinks Prontos",
    slug: "drinks-prontos",
    sortOrder: 4,
    subcategorias: [
      { name: "Drinks em Lata", slug: "drinks-em-lata" },
      { name: "Hard Seltzers", slug: "hard-seltzers" },
      { name: "Coquetéis e Spritz", slug: "coquetelaria-e-spritz" },
      { name: "Xaropes e Bitter", slug: "xaropes-e-bitter" },
      { name: "Gelo e Acessórios", slug: "gelo-e-acessorios" },
    ],
  },
  {
    name: "Bebidas Não Alcoólicas",
    slug: "bebidas-nao-alcoolicas",
    sortOrder: 5,
    subcategorias: [
      { name: "Refrigerantes", slug: "refrigerantes" },
      { name: "Águas e Águas com Gás", slug: "aguas" },
      { name: "Sucos e Néctares", slug: "sucos-e-nectares" },
      { name: "Energéticos e Isotônicos", slug: "energeticos-e-isototnicos" },
      { name: "Kombuchas e Fermentados", slug: "kombuchas-e-fermentados" },
    ],
  },
  {
    name: "Frios e Laticínios",
    slug: "frios-e-laticinios",
    sortOrder: 6,
    subcategorias: [
      { name: "Queijos", slug: "queijos" },
      { name: "Frios e Embutidos", slug: "frios-e-embutidos" },
      { name: "Iogurtes e Coalhadas", slug: "iogurtes" },
      { name: "Manteiga e Requeijão", slug: "manteiga-e-requeijao" },
      { name: "Leites e Bebidas Lácteas", slug: "leites" },
    ],
  },
  {
    name: "Petiscos e Snacks",
    slug: "petiscos-e-snacks",
    sortOrder: 7,
    subcategorias: [
      { name: "Salgadinhos e Chips", slug: "salgadinhos-e-chips" },
      { name: "Castanhas e Mix", slug: "castanhas-e-mix" },
      { name: "Biscoitos e Crackers", slug: "biscoitos-e-crackers" },
      { name: "Amendoim e Snacks", slug: "amendoim-e-snacks" },
      { name: "Doces e Chocolates", slug: "doces-e-chocolates" },
    ],
  },
  {
    name: "Padaria e Mercearia",
    slug: "padaria-e-mercearia",
    sortOrder: 8,
    subcategorias: [
      { name: "Pães e Torradas", slug: "paes-e-torradas" },
      { name: "Geleias, Mel e Pastas", slug: "geleias-e-mel" },
      { name: "Azeites e Condimentos", slug: "azeites-e-condimentos" },
      { name: "Massas, Arroz e Grãos", slug: "massas-e-graos" },
      { name: "Conservas e Enlatados", slug: "conservas-e-enlatados" },
    ],
  },
  {
    name: "Churrasco e Grill",
    slug: "churrasco-e-grill",
    sortOrder: 9,
    subcategorias: [
      { name: "Carnes e Linguiças", slug: "carnes-e-linguicas" },
      { name: "Carvão e Acendedores", slug: "carvao-e-acendedores" },
      { name: "Molhos e Temperos", slug: "molhos-e-temperos-churrasco" },
      { name: "Descartáveis para Churrasco", slug: "descartaveis-churrasco" },
    ],
  },
  {
    name: "Café e Bebidas Quentes",
    slug: "cafe-e-bebidas-quentes",
    sortOrder: 10,
    subcategorias: [
      { name: "Cafés em Grão e Moído", slug: "cafes" },
      { name: "Cápsulas", slug: "capsulas" },
      { name: "Chocolates Quentes", slug: "chocolates-quentes" },
      { name: "Chás e Infusões", slug: "chas-secos" },
    ],
  },
  {
    name: "Higiene e Beleza",
    slug: "higiene-e-beleza",
    sortOrder: 11,
    subcategorias: [
      { name: "Higiene Pessoal", slug: "higiene-pessoal" },
      { name: "Cuidados com o Cabelo", slug: "cabelos" },
      { name: "Higiene Bucal", slug: "higiene-bucal" },
      { name: "Desodorantes e Perfumaria", slug: "desodorantes" },
      { name: "Higiene Íntima", slug: "higiene-intima" },
    ],
  },
  {
    name: "Limpeza e Casa",
    slug: "limpeza-e-casa",
    sortOrder: 12,
    subcategorias: [
      { name: "Limpeza Geral", slug: "limpeza-geral" },
      { name: "Lava-Louças e Detergentes", slug: "lava-loucas" },
      { name: "Descartáveis", slug: "descartaveis-casa" },
      { name: "Papel Higiênico e Guardanapos", slug: "papel-e-guardanapos" },
      { name: "Sacos de Lixo", slug: "sacos-de-lixo" },
    ],
  },
  {
    name: "Hortifrúti e Congelados",
    slug: "hortifruti-e-congelados",
    sortOrder: 13,
    subcategorias: [
      { name: "Frutas", slug: "frutas" },
      { name: "Legumes e Verduras", slug: "legumes-e-verduras" },
      { name: "Congelados Prontos", slug: "congelados-prontos" },
      { name: "Sorvetes e Picolés", slug: "sorvetes-e-picoles" },
    ],
  },
  {
    name: "Kits e Combos",
    slug: "kits-e-combos",
    sortOrder: 14,
    subcategorias: [
      { name: "Kits de Vinho", slug: "kits-de-vinho" },
      { name: "Kits Cervejeiros", slug: "kits-cervejeiros" },
      { name: "Kits de Churrasco", slug: "kits-churrasco" },
      { name: "Kits Presentes", slug: "kits-presentes" },
    ],
  },
  {
    name: "Ofertas e Destaques",
    slug: "ofertas-e-destaques",
    sortOrder: 15,
    subcategorias: [
      { name: "Mais Vendidos", slug: "mais-vendidos" },
      { name: "Promoções da Semana", slug: "promocoes-da-semana" },
      { name: "Novidades", slug: "novidades" },
    ],
  },
];

async function seedCategoriasAdegaIdeal() {
  const store = await prisma.store.findUnique({ where: { slug: STORE_SLUG } });
  if (!store) throw new Error(`Loja "${STORE_SLUG}" não encontrada`);

  const { id: storeId, name } = store;
  console.log(`\n🌱 Criando categorias para: ${name} (${storeId})\n`);

  let totalCategorias = 0;
  let totalSubs = 0;

  for (const cat of TEMPLATE) {
    const pai = await prisma.category.upsert({
      where: { storeId_slug: { storeId, slug: cat.slug } },
      create: {
        storeId,
        name: cat.name,
        slug: cat.slug,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
      update: {
        name: cat.name,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    totalCategorias++;

    let subOrder = 1;
    for (const sub of cat.subcategorias) {
      await prisma.category.upsert({
        where: { storeId_slug: { storeId, slug: sub.slug } },
        create: {
          storeId,
          name: sub.name,
          slug: sub.slug,
          parentCategoryId: pai.id,
          sortOrder: subOrder,
          isActive: true,
        },
        update: {
          name: sub.name,
          parentCategoryId: pai.id,
          sortOrder: subOrder,
          isActive: true,
        },
      });
      subOrder++;
      totalSubs++;
    }

    console.log(`  ✓ ${cat.name} (${cat.subcategorias.length} subcategorias)`);
  }

  console.log(
    `\n✅ Seed concluído: ${totalCategorias} categorias + ${totalSubs} subcategorias\n`
  );
}

seedCategoriasAdegaIdeal()
  .catch((err) => {
    console.error("❌ Erro no seed de categorias:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
