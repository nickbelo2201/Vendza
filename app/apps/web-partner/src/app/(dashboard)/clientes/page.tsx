import type { Cliente, PaginatedResponse } from "@vendza/types";

import { ApiError, fetchAPI } from "../../../lib/api";
import { BuscaClientes } from "./BuscaClientes";

type ClientesResponse = PaginatedResponse<Cliente>;

async function getClientes(): Promise<Cliente[]> {
  try {
    const res = await fetchAPI<ClientesResponse | Cliente[]>("/partner/customers");
    // Suporte ao novo formato paginado { items, pagination }
    if (res && !Array.isArray(res) && "items" in res) return res.items;
    return res as Cliente[];
  }
  catch (err) { if (err instanceof ApiError) return []; return []; }
}

export default async function CustomersPage() {
  const clientes = await getClientes();

  return (
    <div className="wp-stack-lg">
      <div className="wp-page-header">
        <div className="wp-row-between">
          <div>
            <h1>Clientes</h1>
            <p>Base de clientes com histórico e sinais de recorrência.</p>
          </div>
          <span className="wp-badge wp-badge-blue">
            {clientes.length} cliente{clientes.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <BuscaClientes clientes={clientes} />
    </div>
  );
}
