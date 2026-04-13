import { notFound } from "next/navigation";

import { ApiError, fetchAPI } from "@/lib/api";
import { ComandaPedido, type OrderComanda } from "@/components/ComandaPedido";
import { ImprimirAuto } from "@/components/ImprimirAuto";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ImprimirPedidoPage({ params }: PageProps) {
  const { id } = await params;

  let pedido: OrderComanda;

  try {
    pedido = await fetchAPI<OrderComanda>(`/partner/orders/${id}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <>
      <ImprimirAuto />
      <ComandaPedido pedido={pedido} />
    </>
  );
}
