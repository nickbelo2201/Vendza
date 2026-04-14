import { prisma } from "@vendza/database";

import type { PartnerContext } from "./context.js";

export type ImportProductInput = {
  name: string;
  listPriceCents: number;
  salePriceCents?: number | null;
  categoryName?: string | null;
  isAvailable?: boolean;
  description?: string | null;
};

export type ImportResult = {
  imported: number;
  errors: { line: number; message: string }[];
};

function gerarSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function importarProdutos(
  context: PartnerContext,
  produtos: ImportProductInput[],
): Promise<ImportResult> {
  const errors: { line: number; message: string }[] = [];
  let imported = 0;

  // Cache de categorias da loja para evitar queries repetidas
  const categoriaCache = new Map<string, string>(); // nome → id

  for (let i = 0; i < produtos.length; i++) {
    const linha = i + 2; // linha 1 = cabeçalho, dados começam na 2
    const produto = produtos[i];
    if (!produto) continue;

    try {
      if (!produto.name?.trim()) {
        errors.push({ line: linha, message: "Nome do produto é obrigatório." });
        continue;
      }
      if (!produto.listPriceCents || produto.listPriceCents <= 0) {
        errors.push({ line: linha, message: "Preço de venda inválido." });
        continue;
      }

      // Resolver categoryId
      let categoryId: string | null = null;
      if (produto.categoryName?.trim()) {
        const nomeCat = produto.categoryName.trim();
        if (categoriaCache.has(nomeCat)) {
          categoryId = categoriaCache.get(nomeCat)!;
        } else {
          let cat = await prisma.category.findFirst({
            where: { storeId: context.storeId, name: nomeCat },
            select: { id: true },
          });
          if (!cat) {
            const slug = gerarSlug(nomeCat);
            cat = await prisma.category.create({
              data: { storeId: context.storeId, name: nomeCat, slug, isActive: true, sortOrder: 0 },
              select: { id: true },
            });
          }
          categoriaCache.set(nomeCat, cat.id);
          categoryId = cat.id;
        }
      }

      // Gerar slug único para o produto
      let baseSlug = gerarSlug(produto.name.trim());
      let slug = baseSlug;
      let tentativa = 1;
      while (await prisma.product.findFirst({ where: { storeId: context.storeId, slug }, select: { id: true } })) {
        tentativa++;
        slug = `${baseSlug}-${tentativa}`;
      }

      await prisma.product.create({
        data: {
          storeId: context.storeId,
          name: produto.name.trim(),
          slug,
          listPriceCents: produto.listPriceCents,
          salePriceCents: produto.salePriceCents ?? null,
          categoryId,
          isAvailable: produto.isAvailable ?? true,
          description: produto.description?.trim() || null,
        },
      });

      imported++;
    } catch (err) {
      errors.push({
        line: linha,
        message: err instanceof Error ? err.message : "Erro desconhecido.",
      });
    }
  }

  return { imported, errors };
}
