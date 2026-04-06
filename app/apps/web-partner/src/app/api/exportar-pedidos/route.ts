import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../utils/supabase/server";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const params = new URLSearchParams();
  if (searchParams.get("status")) params.set("status", searchParams.get("status")!);
  if (searchParams.get("from")) params.set("from", searchParams.get("from")!);
  if (searchParams.get("to")) params.set("to", searchParams.get("to")!);

  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await fetch(`${API_URL}/v1/partner/orders/export${query}`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Erro ao exportar" }, { status: res.status });
  }

  const csv = await res.text();
  const hoje = new Date().toISOString().split("T")[0];

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos_${hoje}.csv"`,
    },
  });
}
