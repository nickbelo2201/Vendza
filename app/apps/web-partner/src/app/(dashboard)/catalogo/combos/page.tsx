import { fetchAPI } from "../../../../lib/api";
import { CombosClient } from "./CombosClient";

type ComboItem = {
  id: string;
  comboId: string;
  productId: string;
  quantity: number;
  productName: string;
  productSlug: string;
  productListPriceCents: number;
};

type Combo = {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  priceCents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  items: ComboItem[];
};

export default async function CombosPage() {
  let combos: Combo[] = [];

  try {
    combos = await fetchAPI<Combo[]>("/partner/combos");
  } catch {
    combos = [];
  }

  return <CombosClient combosIniciais={combos} />;
}
