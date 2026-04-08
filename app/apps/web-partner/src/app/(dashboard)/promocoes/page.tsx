import { ApiError, fetchAPI } from "../../../lib/api";
import { PromocoesClient } from "./PromocoesClient";

type ProdutoEmPromocao = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number;
  descontoPercent: number;
  currentStock: number;
};

type ProdutoAlerta = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
  salePriceCents: number | null;
  currentStock: number;
  safetyStock?: number;
};

type Resultado = {
  emPromocao: ProdutoEmPromocao[];
  alertasParado: ProdutoAlerta[];
  alertasEstoqueAlto: ProdutoAlerta[];
};

const VAZIO: Resultado = {
  emPromocao: [],
  alertasParado: [],
  alertasEstoqueAlto: [],
};

async function getDados(): Promise<Resultado> {
  try {
    return await fetchAPI<Resultado>("/partner/promocoes");
  } catch (err) {
    if (err instanceof ApiError) return VAZIO;
    return VAZIO;
  }
}

export default async function PromocoesPage() {
  const dados = await getDados();

  return (
    <div className="wp-stack-lg">
      <PromocoesClient dados={dados} />
    </div>
  );
}
