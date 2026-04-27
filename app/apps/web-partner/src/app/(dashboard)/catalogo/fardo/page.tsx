import { fetchAPI } from "../../../../lib/api";
import { FardoClient } from "./FardoClient";

type ProductBundle = {
  id: string;
  productId: string;
  productName?: string;
  name: string;
  slug: string;
  bundlePriceCents: number;
  itemsJson: { quantity: number };
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProdutoSimples = {
  id: string;
  name: string;
  slug: string;
  listPriceCents: number;
};

export default async function FardoPage() {
  let fardos: ProductBundle[] = [];
  let produtos: ProdutoSimples[] = [];

  try {
    [fardos, produtos] = await Promise.all([
      fetchAPI<ProductBundle[]>("/partner/product-bundles"),
      fetchAPI<{ produtos: ProdutoSimples[] }>("/partner/products?limite=1000").then(
        (r) => r.produtos ?? []
      ),
    ]);
  } catch {
    fardos = [];
    produtos = [];
  }

  return <FardoClient fardosIniciais={fardos} produtosIniciais={produtos} />;
}
