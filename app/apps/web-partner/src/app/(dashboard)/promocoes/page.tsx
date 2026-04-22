import type { PromocoesResultado } from "@vendza/types";

import { ApiError, fetchAPI } from "../../../lib/api";
import { PromocoesClient } from "./PromocoesClient";

const VAZIO: PromocoesResultado = {
  emPromocao: [],
  alertasParado: [],
  alertasEstoqueAlto: [],
};

async function getDados(): Promise<PromocoesResultado> {
  try {
    return await fetchAPI<PromocoesResultado>("/partner/promocoes");
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
