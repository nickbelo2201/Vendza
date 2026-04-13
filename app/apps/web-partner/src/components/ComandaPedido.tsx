/**
 * Comanda de pedido — layout para impressão em preto e branco.
 * Compatível com impressoras térmicas e impressão via navegador.
 */

const PAYMENT_LABELS: Record<string, string> = {
  pix: "PIX",
  cash: "Dinheiro",
  card_online: "Cartao na maquina (credito/debito)",
  card_on_delivery: "Cartao na entrega",
};

type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
};

type DeliveryAddress = {
  line1: string;
  number?: string;
  neighborhood: string;
  city: string;
  state: string;
};

export type OrderComanda = {
  id: string;
  publicId: string;
  status: string;
  channel: string;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  totalCents: number;
  subtotalCents?: number;
  deliveryFeeCents?: number;
  discountCents?: number;
  placedAt: string;
  items: OrderItem[];
  deliveryAddress?: DeliveryAddress;
  address?: DeliveryAddress;
  notes?: string;
  note?: string;
};

function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function linha(char = "-", tamanho = 40): string {
  return char.repeat(tamanho);
}

type Props = {
  pedido: OrderComanda;
  nomeLojaEnv?: string;
};

export function ComandaPedido({ pedido, nomeLojaEnv }: Props) {
  const nomeLoja = nomeLojaEnv ?? process.env.NEXT_PUBLIC_STORE_NAME ?? "Vendza";
  const dataFormatada = new Date(pedido.placedAt).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const endereco = pedido.deliveryAddress ?? pedido.address;
  const observacao = pedido.notes ?? pedido.note;
  const subtotal = pedido.subtotalCents ?? pedido.totalCents;
  const taxaEntrega = pedido.deliveryFeeCents ?? 0;
  const desconto = pedido.discountCents ?? 0;

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 400,
        margin: "0 auto",
        padding: "16px 8px",
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: 13,
        color: "#000",
        background: "#fff",
        lineHeight: 1.6,
      }}
    >
      {/* Cabecalho */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: "bold", fontSize: 16, letterSpacing: 1 }}>
          {nomeLoja.toUpperCase()}
        </div>
        <div style={{ fontSize: 11, marginTop: 2 }}>Comprovante de Pedido</div>
      </div>

      <div style={{ borderTop: "2px solid #000", borderBottom: "2px solid #000", padding: "4px 0", marginBottom: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontWeight: "bold" }}>Pedido: {pedido.publicId}</span>
          <span style={{ fontSize: 11 }}>{dataFormatada}</span>
        </div>
      </div>

      {/* Cliente */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>
          Cliente
        </div>
        <div>Nome: {pedido.customerName}</div>
        {pedido.customerPhone && <div>Tel: {pedido.customerPhone}</div>}
      </div>

      <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />

      {/* Itens */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>
          Itens
        </div>
        {pedido.items.map((item, idx) => (
          <div key={item.productId ?? idx} style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
            <span>
              {item.quantity}x {item.productName}
            </span>
            <span style={{ whiteSpace: "nowrap", marginLeft: 8 }}>
              {formatCents(item.totalCents)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: "1px solid #000", margin: "8px 0" }} />

      {/* Totais */}
      <div style={{ marginBottom: 8 }}>
        {taxaEntrega > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Subtotal</span>
            <span>{formatCents(subtotal)}</span>
          </div>
        )}
        {taxaEntrega > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Taxa de entrega</span>
            <span>{formatCents(taxaEntrega)}</span>
          </div>
        )}
        {desconto > 0 && (
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span>Desconto</span>
            <span>- {formatCents(desconto)}</span>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 15, marginTop: 4 }}>
          <span>TOTAL</span>
          <span>{formatCents(pedido.totalCents)}</span>
        </div>
        <div style={{ fontSize: 12, marginTop: 4 }}>
          Pagamento: {PAYMENT_LABELS[pedido.paymentMethod] ?? pedido.paymentMethod}
        </div>
      </div>

      {/* Endereco de entrega */}
      {endereco && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>
              Entrega
            </div>
            <div>
              {endereco.line1}
              {endereco.number ? `, ${endereco.number}` : ""}
            </div>
            <div>
              {endereco.neighborhood} — {endereco.city}/{endereco.state}
            </div>
          </div>
        </>
      )}

      {/* Observacao */}
      {observacao && (
        <>
          <div style={{ borderTop: "1px dashed #000", margin: "8px 0" }} />
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: "bold", textTransform: "uppercase", fontSize: 11, letterSpacing: 1, marginBottom: 4 }}>
              Obs
            </div>
            <div>{observacao}</div>
          </div>
        </>
      )}

      <div style={{ borderTop: "2px solid #000", marginTop: 8, paddingTop: 6, textAlign: "center", fontSize: 11 }}>
        {new Date().getFullYear()} — {nomeLoja}
      </div>
    </div>
  );
}
