/**
 * Calcula o preço total de um item levando em conta o desconto por fardo.
 *
 * Exemplo: produto de R$10/un, fardo de 6 unidades por R$48.
 * Quantidade 8 → 1 fardo (R$48) + 2 avulsas (R$20) = R$68
 */
export function calcularPrecoComFardo(params: {
  quantidade: number;
  precoAvulsoCents: number;
  bundlePriceCents: number;
  quantidadeFardo: number;
}): {
  totalCents: number;
  fardosCompletos: number;
  unidadesRestantes: number;
  temDesconto: boolean;
} {
  const { quantidade, precoAvulsoCents, bundlePriceCents, quantidadeFardo } = params;

  const fardosCompletos = Math.floor(quantidade / quantidadeFardo);
  const unidadesRestantes = quantidade % quantidadeFardo;
  const totalCents = fardosCompletos * bundlePriceCents + unidadesRestantes * precoAvulsoCents;
  const temDesconto = fardosCompletos > 0 && bundlePriceCents < quantidadeFardo * precoAvulsoCents;

  return { totalCents, fardosCompletos, unidadesRestantes, temDesconto };
}
