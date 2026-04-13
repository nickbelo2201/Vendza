"use server";

import { fetchAPI } from "../../lib/api";

export async function moverCardKanban(orderId: string, status: string): Promise<void> {
  await fetchAPI(`/partner/orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
  });
}
