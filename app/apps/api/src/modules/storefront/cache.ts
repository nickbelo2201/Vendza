import { prisma } from "@vendza/database";

import { getRedis } from "../../plugins/redis.js";

/**
 * Invalida todas as chaves de cache do storefront de uma loja.
 *
 * Padrões invalidados:
 *  - sf:cat:{storeId}          — lista de categorias
 *  - sf:prod:{storeId}:*       — páginas de produtos
 *  - sf:config:{storeSlug}     — configuração da loja
 *  - sf:bootstrap:{storeSlug}  — payload de bootstrap (config + categorias + produtos)
 *
 * Degrada graciosamente: se o Redis estiver offline ou indisponível,
 * a função retorna sem lançar exceção, preservando a operação principal.
 */
export async function invalidateStorefrontCache(storeId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  try {
    // Chaves baseadas em storeId (cat + prod)
    const keysPorId = await redis.keys(`sf:*:${storeId}*`);

    // Chaves baseadas em slug (config + bootstrap) — precisamos resolver o slug
    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { slug: true },
    });

    const keysPorSlug: string[] = [];
    if (store?.slug) {
      // Busca explícita das chaves por slug para garantir invalidação completa
      const configKeys = await redis.keys(`sf:config:${store.slug}`);
      const bootstrapKeys = await redis.keys(`sf:bootstrap:${store.slug}`);
      keysPorSlug.push(...configKeys, ...bootstrapKeys);
    }

    const todasAsChaves = [...new Set([...keysPorId, ...keysPorSlug])];

    if (todasAsChaves.length > 0) {
      await redis.del(...todasAsChaves);
    }
  } catch {
    // Redis indisponível — a operação principal já foi concluída com sucesso
  }
}
