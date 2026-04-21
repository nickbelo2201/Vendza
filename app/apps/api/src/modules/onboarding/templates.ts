// ─── Templates de categorias para onboarding ───────────────────────────────
// Cada template define categorias pai + subcategorias para um segmento de loja.
// Os templates podem ser aplicados standalone ou combinados (ex: adega + mercado).

export interface TemplateSubcategory {
  name: string;
  slug: string;
  sortOrder: number;
}

export interface TemplateCategory {
  name: string;
  slug: string;
  sortOrder: number;
  subcategories: TemplateSubcategory[];
}

export interface CategoryTemplate {
  templateId: string;
  name: string;
  description: string;
  categories: TemplateCategory[];
}

export const CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  restaurante: {
    templateId: "restaurante",
    name: "Restaurante",
    description: "Comida, bebidas, sobremesas",
    categories: [
      {
        name: "Entradas",
        slug: "entradas",
        sortOrder: 1,
        subcategories: [
          { name: "Saladas", slug: "saladas", sortOrder: 1 },
          { name: "Sopas e Caldos", slug: "sopas-caldos", sortOrder: 2 },
          { name: "Petiscos", slug: "petiscos", sortOrder: 3 },
          { name: "Bruschetas e Torradas", slug: "bruschetas-torradas", sortOrder: 4 },
        ],
      },
      {
        name: "Pratos Principais",
        slug: "pratos-principais",
        sortOrder: 2,
        subcategories: [
          { name: "Carnes", slug: "carnes", sortOrder: 1 },
          { name: "Aves", slug: "aves", sortOrder: 2 },
          { name: "Peixes e Frutos do Mar", slug: "peixes-frutos-do-mar", sortOrder: 3 },
          { name: "Massas", slug: "massas", sortOrder: 4 },
          { name: "Risotos", slug: "risotos", sortOrder: 5 },
          { name: "Vegetariano / Vegano", slug: "vegetariano-vegano", sortOrder: 6 },
        ],
      },
      {
        name: "Acompanhamentos",
        slug: "acompanhamentos",
        sortOrder: 3,
        subcategories: [
          { name: "Arroz e Feijão", slug: "arroz-feijao", sortOrder: 1 },
          { name: "Legumes e Verduras", slug: "legumes-verduras", sortOrder: 2 },
          { name: "Batatas", slug: "batatas", sortOrder: 3 },
          { name: "Farofas", slug: "farofas", sortOrder: 4 },
        ],
      },
      {
        name: "Lanches e Sanduíches",
        slug: "lanches-sanduiches",
        sortOrder: 4,
        subcategories: [
          { name: "Hambúrgueres", slug: "hamburgueres", sortOrder: 1 },
          { name: "Sanduíches Quentes", slug: "sanduiches-quentes", sortOrder: 2 },
          { name: "Wraps e Tacos", slug: "wraps-tacos", sortOrder: 3 },
          { name: "Hot Dogs", slug: "hot-dogs", sortOrder: 4 },
        ],
      },
      {
        name: "Pizzas",
        slug: "pizzas",
        sortOrder: 5,
        subcategories: [
          { name: "Pizza Salgada", slug: "pizza-salgada", sortOrder: 1 },
          { name: "Pizza Doce", slug: "pizza-doce", sortOrder: 2 },
          { name: "Calzones", slug: "calzones", sortOrder: 3 },
          { name: "Esfihas", slug: "esfihas", sortOrder: 4 },
        ],
      },
      {
        name: "Sobremesas",
        slug: "sobremesas",
        sortOrder: 6,
        subcategories: [
          { name: "Bolos e Tortas", slug: "bolos-tortas", sortOrder: 1 },
          { name: "Sorvetes e Açaí", slug: "sorvetes-acai", sortOrder: 2 },
          { name: "Pudins e Mousses", slug: "pudins-mousses", sortOrder: 3 },
          { name: "Doces e Brigadeiros", slug: "doces-brigadeiros", sortOrder: 4 },
        ],
      },
      {
        name: "Bebidas",
        slug: "bebidas",
        sortOrder: 7,
        subcategories: [
          { name: "Sucos Naturais", slug: "sucos-naturais", sortOrder: 1 },
          { name: "Refrigerantes", slug: "refrigerantes-rest", sortOrder: 2 },
          { name: "Água", slug: "agua-rest", sortOrder: 3 },
          { name: "Cervejas", slug: "cervejas-rest", sortOrder: 4 },
          { name: "Vinhos e Espumantes", slug: "vinhos-espumantes-rest", sortOrder: 5 },
          { name: "Drinks e Coquetéis", slug: "drinks-coqueteis", sortOrder: 6 },
        ],
      },
      {
        name: "Combos e Promoções",
        slug: "combos-promocoes",
        sortOrder: 8,
        subcategories: [
          { name: "Combo Individual", slug: "combo-individual", sortOrder: 1 },
          { name: "Combo Família", slug: "combo-familia", sortOrder: 2 },
          { name: "Promoção do Dia", slug: "promocao-do-dia", sortOrder: 3 },
          { name: "Festival", slug: "festival", sortOrder: 4 },
        ],
      },
    ],
  },

  adega: {
    templateId: "adega",
    name: "Adega",
    description: "Bebidas alcoólicas e acessórios",
    categories: [
      {
        name: "Vinhos",
        slug: "vinhos",
        sortOrder: 1,
        subcategories: [
          { name: "Vinho Tinto", slug: "vinho-tinto", sortOrder: 1 },
          { name: "Vinho Branco", slug: "vinho-branco", sortOrder: 2 },
          { name: "Vinho Rosé", slug: "vinho-rose", sortOrder: 3 },
          { name: "Vinho Laranja", slug: "vinho-laranja", sortOrder: 4 },
        ],
      },
      {
        name: "Espumantes",
        slug: "espumantes",
        sortOrder: 2,
        subcategories: [
          { name: "Champagne", slug: "champagne", sortOrder: 1 },
          { name: "Prosecco", slug: "prosecco", sortOrder: 2 },
          { name: "Cava", slug: "cava", sortOrder: 3 },
          { name: "Espumante Nacional", slug: "espumante-nacional", sortOrder: 4 },
        ],
      },
      {
        name: "Cervejas",
        slug: "cervejas",
        sortOrder: 3,
        subcategories: [
          { name: "Lager / Pilsen", slug: "lager-pilsen", sortOrder: 1 },
          { name: "IPA", slug: "ipa", sortOrder: 2 },
          { name: "Stout", slug: "stout", sortOrder: 3 },
          { name: "Weiss / Trigo", slug: "weiss-trigo", sortOrder: 4 },
        ],
      },
      {
        name: "Destilados",
        slug: "destilados",
        sortOrder: 4,
        subcategories: [
          { name: "Whisky", slug: "whisky", sortOrder: 1 },
          { name: "Vodka", slug: "vodka", sortOrder: 2 },
          { name: "Gin", slug: "gin", sortOrder: 3 },
          { name: "Rum", slug: "rum", sortOrder: 4 },
          { name: "Cachaça", slug: "cachaca", sortOrder: 5 },
          { name: "Tequila / Mezcal", slug: "tequila-mezcal", sortOrder: 6 },
        ],
      },
      {
        name: "Licores e Aperitivos",
        slug: "licores-aperitivos",
        sortOrder: 5,
        subcategories: [
          { name: "Licor", slug: "licor", sortOrder: 1 },
          { name: "Aperitivo / Bitter", slug: "aperitivo-bitter", sortOrder: 2 },
        ],
      },
      {
        name: "Bebidas sem Álcool",
        slug: "bebidas-sem-alcool",
        sortOrder: 6,
        subcategories: [
          { name: "Sucos e Néctares", slug: "sucos-nectares", sortOrder: 1 },
          { name: "Refrigerantes", slug: "refrigerantes", sortOrder: 2 },
          { name: "Água", slug: "agua", sortOrder: 3 },
          { name: "Energéticos", slug: "energeticos", sortOrder: 4 },
        ],
      },
      {
        name: "Acessórios",
        slug: "acessorios",
        sortOrder: 7,
        subcategories: [
          { name: "Taças e Copos", slug: "tacas-copos", sortOrder: 1 },
          { name: "Abridor / Saca-rolha", slug: "abridor-saca-rolha", sortOrder: 2 },
          { name: "Embalagem para Presente", slug: "embalagem-presente", sortOrder: 3 },
        ],
      },
    ],
  },

  mercado: {
    templateId: "mercado",
    name: "Mercado",
    description: "Alimentos, bebidas, higiene, limpeza",
    categories: [
      {
        name: "Hortifrúti",
        slug: "hortifruti",
        sortOrder: 1,
        subcategories: [
          { name: "Frutas", slug: "frutas", sortOrder: 1 },
          { name: "Verduras e Legumes", slug: "verduras-legumes", sortOrder: 2 },
          { name: "Temperos Frescos", slug: "temperos-frescos", sortOrder: 3 },
          { name: "Orgânicos", slug: "organicos", sortOrder: 4 },
        ],
      },
      {
        name: "Padaria e Confeitaria",
        slug: "padaria-confeitaria",
        sortOrder: 2,
        subcategories: [
          { name: "Pães", slug: "paes", sortOrder: 1 },
          { name: "Bolos e Tortas", slug: "bolos-tortas-merc", sortOrder: 2 },
          { name: "Biscoitos e Bolachas", slug: "biscoitos-bolachas", sortOrder: 3 },
          { name: "Salgados", slug: "salgados", sortOrder: 4 },
        ],
      },
      {
        name: "Açougue",
        slug: "acougue",
        sortOrder: 3,
        subcategories: [
          { name: "Carne Bovina", slug: "carne-bovina", sortOrder: 1 },
          { name: "Carne Suína", slug: "carne-suina", sortOrder: 2 },
          { name: "Frango e Aves", slug: "frango-aves", sortOrder: 3 },
          { name: "Peixes e Frutos do Mar", slug: "peixes-frutos-mar-merc", sortOrder: 4 },
          { name: "Embutidos e Frios", slug: "embutidos-frios", sortOrder: 5 },
        ],
      },
      {
        name: "Laticínios e Frios",
        slug: "laticinios-frios",
        sortOrder: 4,
        subcategories: [
          { name: "Leite e Derivados", slug: "leite-derivados", sortOrder: 1 },
          { name: "Queijos", slug: "queijos", sortOrder: 2 },
          { name: "Iogurtes", slug: "iogurtes", sortOrder: 3 },
          { name: "Manteiga e Margarina", slug: "manteiga-margarina", sortOrder: 4 },
        ],
      },
      {
        name: "Mercearia",
        slug: "mercearia",
        sortOrder: 5,
        subcategories: [
          { name: "Arroz, Feijão e Grãos", slug: "arroz-feijao-graos", sortOrder: 1 },
          { name: "Massas e Molhos", slug: "massas-molhos", sortOrder: 2 },
          { name: "Óleos e Azeites", slug: "oleos-azeites", sortOrder: 3 },
          { name: "Conservas e Enlatados", slug: "conservas-enlatados", sortOrder: 4 },
          { name: "Temperos e Condimentos", slug: "temperos-condimentos", sortOrder: 5 },
          { name: "Farinhas e Fermentos", slug: "farinhas-fermentos", sortOrder: 6 },
        ],
      },
      {
        name: "Congelados",
        slug: "congelados",
        sortOrder: 6,
        subcategories: [
          { name: "Pratos Prontos", slug: "pratos-prontos", sortOrder: 1 },
          { name: "Pizzas Congeladas", slug: "pizzas-congeladas", sortOrder: 2 },
          { name: "Sorvetes", slug: "sorvetes", sortOrder: 3 },
          { name: "Legumes Congelados", slug: "legumes-congelados", sortOrder: 4 },
        ],
      },
      {
        name: "Bebidas",
        slug: "bebidas-merc",
        sortOrder: 7,
        subcategories: [
          { name: "Água", slug: "agua-merc", sortOrder: 1 },
          { name: "Refrigerantes", slug: "refrigerantes-merc", sortOrder: 2 },
          { name: "Sucos", slug: "sucos-merc", sortOrder: 3 },
          { name: "Cervejas", slug: "cervejas-merc", sortOrder: 4 },
          { name: "Vinhos", slug: "vinhos-merc", sortOrder: 5 },
          { name: "Destilados", slug: "destilados-merc", sortOrder: 6 },
        ],
      },
      {
        name: "Higiene Pessoal",
        slug: "higiene-pessoal",
        sortOrder: 8,
        subcategories: [
          { name: "Sabonetes e Shampoos", slug: "sabonetes-shampoos", sortOrder: 1 },
          { name: "Creme Dental e Escova", slug: "creme-dental-escova", sortOrder: 2 },
          { name: "Desodorantes", slug: "desodorantes", sortOrder: 3 },
          { name: "Papel Higiênico", slug: "papel-higienico", sortOrder: 4 },
        ],
      },
      {
        name: "Limpeza",
        slug: "limpeza",
        sortOrder: 9,
        subcategories: [
          { name: "Detergente e Sabão", slug: "detergente-sabao", sortOrder: 1 },
          { name: "Desinfetante e Multiuso", slug: "desinfetante-multiuso", sortOrder: 2 },
          { name: "Amaciante e Alvejante", slug: "amaciante-alvejante", sortOrder: 3 },
          { name: "Esponjas e Panos", slug: "esponjas-panos", sortOrder: 4 },
        ],
      },
      {
        name: "Pet",
        slug: "pet",
        sortOrder: 10,
        subcategories: [
          { name: "Ração", slug: "racao", sortOrder: 1 },
          { name: "Petiscos Pet", slug: "petiscos-pet", sortOrder: 2 },
          { name: "Higiene Pet", slug: "higiene-pet", sortOrder: 3 },
          { name: "Acessórios Pet", slug: "acessorios-pet", sortOrder: 4 },
        ],
      },
    ],
  },
};

// ─── IDs válidos ────────────────────────────────────────────────────────────

export const VALID_TEMPLATE_IDS = Object.keys(CATEGORY_TEMPLATES);

// ─── Combos permitidos ─────────────────────────────────────────────────────
// "restaurante" = standalone somente
// "adega" = standalone OU adega + mercado
// "mercado" = standalone OU adega + mercado

export function validateTemplateCombo(templateIds: string[]): {
  valid: boolean;
  error?: string;
} {
  // Validar se todos os IDs são válidos
  const invalidos = templateIds.filter((id) => !VALID_TEMPLATE_IDS.includes(id));
  if (invalidos.length > 0) {
    return {
      valid: false,
      error: `Template(s) inválido(s): ${invalidos.join(", ")}. Válidos: ${VALID_TEMPLATE_IDS.join(", ")}`,
    };
  }

  // Sem duplicatas
  const unique = [...new Set(templateIds)];
  if (unique.length === 0) {
    return { valid: false, error: "Nenhum template informado." };
  }

  // Restaurante é standalone — não pode combinar com outro
  if (unique.includes("restaurante") && unique.length > 1) {
    return {
      valid: false,
      error: "O template 'restaurante' não pode ser combinado com outros templates.",
    };
  }

  // Somente combos permitidos: standalone qualquer, ou adega + mercado
  if (unique.length > 2) {
    return {
      valid: false,
      error: "Máximo de 2 templates combinados.",
    };
  }

  if (unique.length === 2) {
    const sorted = [...unique].sort();
    if (sorted[0] !== "adega" || sorted[1] !== "mercado") {
      return {
        valid: false,
        error: "A única combinação permitida é 'adega' + 'mercado'.",
      };
    }
  }

  return { valid: true };
}

// ─── Combinar templates (com deduplicação por slug) ─────────────────────────

export function combineTemplates(templateIds: string[]): TemplateCategory[] {
  const unique = [...new Set(templateIds)];
  const slugsSeen = new Set<string>();
  const combined: TemplateCategory[] = [];
  let sortOffset = 0;

  for (const id of unique) {
    const template = CATEGORY_TEMPLATES[id];
    if (!template) continue;

    for (const cat of template.categories) {
      if (slugsSeen.has(cat.slug)) continue; // deduplicação por slug da categoria pai
      slugsSeen.add(cat.slug);

      // Deduplica subcategorias também
      const subSlugs = new Set<string>();
      const dedupedSubs: TemplateSubcategory[] = [];
      for (const sub of cat.subcategories) {
        if (!subSlugs.has(sub.slug)) {
          subSlugs.add(sub.slug);
          dedupedSubs.push(sub);
        }
      }

      combined.push({
        ...cat,
        sortOrder: sortOffset + cat.sortOrder,
        subcategories: dedupedSubs,
      });
    }

    // Offset para o próximo template manter ordem
    sortOffset = combined.length;
  }

  return combined;
}

// ─── Contadores de templates ────────────────────────────────────────────────

export function getTemplateCounts(templateId: string): {
  categoryCount: number;
  subcategoryCount: number;
} {
  const template = CATEGORY_TEMPLATES[templateId];
  if (!template) return { categoryCount: 0, subcategoryCount: 0 };

  const categoryCount = template.categories.length;
  const subcategoryCount = template.categories.reduce(
    (acc, cat) => acc + cat.subcategories.length,
    0,
  );

  return { categoryCount, subcategoryCount };
}
