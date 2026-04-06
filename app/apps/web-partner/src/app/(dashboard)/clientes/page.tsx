import { ApiError, fetchAPI } from "../../../lib/api";
import { BuscaClientes } from "./BuscaClientes";

type Cliente = {
  id: string; name: string; phone: string; email: string | null;
  totalSpentCents: number; isInactive: boolean; lastOrderAt: string | null;
};

async function getClientes(): Promise<Cliente[]> {
  try { return await fetchAPI<Cliente[]>("/partner/customers"); }
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
