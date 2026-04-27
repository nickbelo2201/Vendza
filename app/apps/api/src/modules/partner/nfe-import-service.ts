import type { PartnerContext } from "./context.js";
import { importarProdutos, type ImportResult } from "./import-service.js";

// ─── Parser XML de NF-e ──────────────────────────────────────────────────────

/**
 * Extrai o conteúdo de uma tag XML simples (sem atributos) da string fornecida.
 * Retorna null se a tag não for encontrada.
 */
function extrairTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = regex.exec(xml);
  return match && match[1] !== undefined ? match[1].trim() : null;
}

/**
 * Extrai todos os blocos <det>...</det> de um XML de NF-e.
 */
function extrairBlocosDet(xml: string): string[] {
  const blocos: string[] = [];
  const regex = /<det[\s\S]*?<\/det>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(xml)) !== null) {
    blocos.push(match[0]);
  }
  return blocos;
}

export type NfeProduto = {
  name: string;
  unitPriceCents: number;
  quantity: number;
  code: string;
};

/**
 * Parseia os produtos de um XML de NF-e (SEFAZ) sem dependências externas.
 * Extrai os campos relevantes de cada bloco <det>:
 *   - <cProd>: código do produto
 *   - <xProd>: nome do produto
 *   - <qCom>: quantidade comercial
 *   - <vUnCom>: valor unitário comercial
 */
export function extractNfeProducts(xml: string): NfeProduto[] {
  const blocos = extrairBlocosDet(xml);
  const produtos: NfeProduto[] = [];

  for (const bloco of blocos) {
    // Extrair somente o bloco <prod>
    const prodBloco = extrairTag(bloco, "prod");
    if (!prodBloco) continue;

    const code = extrairTag(prodBloco, "cProd") ?? "";
    const name = extrairTag(prodBloco, "xProd") ?? "";
    const qComStr = extrairTag(prodBloco, "qCom") ?? "0";
    const vUnComStr = extrairTag(prodBloco, "vUnCom") ?? "0";

    if (!name) continue;

    const quantity = parseFloat(qComStr.replace(",", "."));
    const vUnCom = parseFloat(vUnComStr.replace(",", "."));

    if (isNaN(quantity) || isNaN(vUnCom)) continue;

    // Converter para centavos (arredondando)
    const unitPriceCents = Math.round(vUnCom * 100);

    produtos.push({
      name,
      unitPriceCents,
      quantity: Math.max(1, Math.round(quantity)),
      code,
    });
  }

  return produtos;
}

// ─── Importação via NF-e ──────────────────────────────────────────────────────

/**
 * Parseia um XML de NF-e e importa os produtos encontrados na loja,
 * usando a mesma lógica de `importarProdutos` (com geração de slug,
 * criação de InventoryItem, etc.).
 */
export async function importarNfe(
  context: PartnerContext,
  xmlContent: string,
): Promise<ImportResult> {
  const produtos = extractNfeProducts(xmlContent);

  if (produtos.length === 0) {
    return { imported: 0, errors: [{ line: 1, message: "Nenhum produto encontrado no XML da NF-e. Verifique se o arquivo é válido." }] };
  }

  // Converter para o formato esperado por importarProdutos
  const importInputs = produtos.map((p) => ({
    name: p.name,
    listPriceCents: p.unitPriceCents > 0 ? p.unitPriceCents : 1,
  }));

  return importarProdutos(context, importInputs);
}
